import json
import sys

CONTRACT = "contracts/grant_path.py"
URL = "https://example.org/grants/green-builders"
SOURCE = "Green Builders Grant. Applications are open until December 31, 2030. Applicants must operate in Morocco. Projects must reduce energy use. A public prototype is required before final review."
PROFILE = "Our cooperative operates in Morocco. The project reduces energy use in small workshops through automated scheduling. We have not yet published a public prototype."


def result(states=("PASS", "PASS", "MISSING")):
    return {"deadline_status": "OPEN", "criteria": [
        {"index": 0, "state": states[0], "source_index": 0, "requirement_quote": "Applicants must operate in Morocco", "profile_quote": "Our cooperative operates in Morocco" if states[0] == "PASS" else ""},
        {"index": 1, "state": states[1], "source_index": 0, "requirement_quote": "Projects must reduce energy use", "profile_quote": "project reduces energy use in small workshops" if states[1] == "PASS" else ""},
        {"index": 2, "state": states[2], "source_index": 0, "requirement_quote": "A public prototype is required before final review", "profile_quote": "A public prototype is available at our project page" if states[2] == "PASS" else ""},
    ]}


def create(contract):
    return contract.create_case("green-2030", "Green workshop application", "Check readiness for the Green Builders funding round before preparing the full application.", PROFILE, json.dumps([URL]))


def mocks(vm, states=("PASS", "PASS", "MISSING")):
    vm.mock_web(URL, {"method": "GET", "status": 200, "body": SOURCE})
    vm.mock_llm("GRANTPATH_PRODUCER", json.dumps(json.dumps(result(states))))


def enable_consensus(contract, monkeypatch, validator=None):
    module = sys.modules[contract.__class__.__module__]
    monkeypatch.setattr(module.gl.eq_principle, "strict_eq", lambda fn: fn())
    monkeypatch.setattr(module.gl.eq_principle, "prompt_comparative", validator or (lambda fn, *_args, **_kwargs: fn()))


def test_contract_loads(direct_deploy):
    assert direct_deploy(CONTRACT) is not None


def test_rejects_duplicate_ids_and_unsafe_sources(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT)
    with direct_vm.expect_revert("public HTTPS"):
        contract.create_case("unsafe-case", "Unsafe source", "Check this sufficiently detailed grant application goal before submitting it.", PROFILE, json.dumps(["http://localhost/grant"]))
    create(contract)
    with direct_vm.expect_revert("already exists"):
        create(contract)


def test_assessment_binds_criteria_quotes_and_receipts(direct_vm, direct_deploy, monkeypatch):
    contract = direct_deploy(CONTRACT); enable_consensus(contract, monkeypatch); case_id = create(contract); mocks(direct_vm)
    assessment = contract.assess(case_id); direct_vm.clear_mocks()
    assert assessment["overall"] == "NEEDS_WORK"
    assert len(assessment["criteria"]) == 3 and len(assessment["source_receipts"][0]["sha256"]) == 64
    assert contract.get_case(case_id)["status"] == "ASSESSED"


def test_overall_is_derived_from_exact_criteria(direct_vm, direct_deploy, monkeypatch):
    contract = direct_deploy(CONTRACT); enable_consensus(contract, monkeypatch); case_id = create(contract); mocks(direct_vm, ("PASS", "FAIL", "MISSING"))
    assert contract.assess(case_id)["overall"] == "NOT_ELIGIBLE"


def test_forged_quote_and_source_index_fail_closed(direct_vm, direct_deploy, monkeypatch):
    contract = direct_deploy(CONTRACT); enable_consensus(contract, monkeypatch); case_id = create(contract)
    forged = result(); forged["criteria"][0]["requirement_quote"] = "Applicants receive automatic approval"
    direct_vm.mock_web(URL, {"method": "GET", "status": 200, "body": SOURCE}); direct_vm.mock_llm("GRANTPATH_PRODUCER", json.dumps(json.dumps(forged)))
    with direct_vm.expect_revert("Requirement quote"):
        contract.assess(case_id)
    direct_vm.clear_mocks()


def test_validator_rejects_semantic_forgery_even_with_same_overall(direct_vm, direct_deploy, monkeypatch):
    contract = direct_deploy(CONTRACT)
    def validator(fn, *_args, **_kwargs):
        candidate = json.loads(fn())
        if candidate["criteria"][1]["state"] != "PASS":
            raise sys.modules[contract.__class__.__module__].gl.vm.UserError("[LLM_ERROR] Validator rejected false energy finding")
        return json.dumps(candidate)
    enable_consensus(contract, monkeypatch, validator); case_id = create(contract); mocks(direct_vm, ("PASS", "MISSING", "MISSING"))
    with direct_vm.expect_revert("Validator rejected false energy finding"):
        contract.assess(case_id)


def test_comparator_cannot_replace_the_contract_schema(direct_vm, direct_deploy, monkeypatch):
    contract = direct_deploy(CONTRACT)
    def aliased(fn, *_args, **_kwargs):
        fn()
        return json.dumps({"deadline_status": "OPEN", "eligibility": []})
    enable_consensus(contract, monkeypatch, aliased); case_id = create(contract); mocks(direct_vm)
    with direct_vm.expect_revert("Two to eight criteria"):
        contract.assess(case_id)


def test_revision_authorization_reassessment_and_terminal_finalization(direct_vm, direct_deploy, direct_alice, direct_bob, monkeypatch):
    contract = direct_deploy(CONTRACT); enable_consensus(contract, monkeypatch); direct_vm.sender = direct_alice; case_id = create(contract); mocks(direct_vm); contract.assess(case_id); direct_vm.clear_mocks()
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only the case owner"):
        contract.revise_profile(case_id, PROFILE + " A public prototype is available at our project page.")
    direct_vm.sender = direct_alice
    revised = contract.revise_profile(case_id, PROFILE + " A public prototype is available at our project page.")
    assert revised["revision"] == 1 and revised["status"] == "READY"
    mocks(direct_vm, ("PASS", "PASS", "PASS")); assert contract.assess(case_id)["overall"] == "READY"; direct_vm.clear_mocks()
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only the case owner"):
        contract.finalize(case_id)
    direct_vm.sender = direct_alice; assert contract.finalize(case_id)["status"] == "FINAL"
    with direct_vm.expect_revert("Only an assessed case"):
        contract.finalize(case_id)
