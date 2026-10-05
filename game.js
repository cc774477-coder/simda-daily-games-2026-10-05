(() => {
  "use strict";
  const games = {
    combo: { title: "두 영웅의 스킬을 이어 보스 약점 깨기 / 협동 RPG / 콤보 보스전", detail: "전사의 표식과 마법사의 약점 폭발을 연결해 5라운드 안에 보스를 쓰러뜨리세요.", type: "역할 연계" },
    escort: { title: "부상자를 호위해 몬스터 구역 탈출하기 / 협동 RPG / 호위 전술", detail: "정찰자와 수호자의 행동을 정해 부상자를 살리면서 탈출 거리 6을 달성하세요.", type: "호위 선택" },
    clues: { title: "서로 다른 단서를 교환해 미궁 문 열기 / 협동 RPG / 정보 협력 퍼즐", detail: "탐색가와 서기관의 단서를 모두 확인하고 오답 제한 안에 문 3개를 여세요.", type: "단서 협력" },
  };
  const app = document.querySelector("#app");
  const query = new URLSearchParams(location.search).get("game");
  let current = Object.hasOwn(games, query) ? query : "combo";
  let state = null;
  const bossAttacks = [2, 3, 3, 4, 4];
  const safeLanes = ["left", "right", "right", "left", "right"];
  const hazards = [2, 3, 2, 3, 4];
  const doors = [
    { name: "첫 번째 문", a: "낮에는 길을 밝히지만 밤에는 볼 수 없습니다.", b: "뜨겁고 하늘에서 떠오릅니다.", choices: ["해", "달", "불"], answer: "해" },
    { name: "두 번째 문", a: "차갑고 손으로 붙잡을 수 없습니다.", b: "흐르며 그릇의 모양을 따릅니다.", choices: ["돌", "물", "바람"], answer: "물" },
    { name: "마지막 문", a: "밤하늘에서 길을 찾을 때 사용합니다.", b: "달보다 작게 보이지만 아주 많습니다.", choices: ["달", "구름", "별"], answer: "별" },
  ];
  function start() {
    if (current === "combo") state = { phase: "playing", round: 0, boss: 24, hp: 12, focus: 1, warrior: null, mage: null, order: "warrior", bonus: 0, message: "두 역할의 기술과 실행 순서를 선택하세요." };
    if (current === "escort") state = { phase: "playing", stage: 0, distance: 0, wounded: 8, scout: null, guardian: null, lane: null, armor: 0, message: "정찰자의 행동을 정하고 길과 수호자의 행동을 선택하세요." };
    if (current === "clues") state = { phase: "playing", door: 0, mistakes: 0, maxMistakes: 2, revealedA: false, revealedB: false, hint: false, message: "각 역할의 단서를 눌러 확인하세요." };
    render();
  }
  const stat = (label, value) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`;
  const btn = (label, action, attrs = "", cls = "choice") => `<button type="button" class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
  const outcome = (win, success, failure, detail) => `<div class="outcome${win ? "" : " fail"}"><h2>${win ? success : failure}</h2><p>${detail}</p><div class="actions">${btn("같은 게임 다시 시작", "restart", "", "primary")}</div></div>`;
  const notice = (s) => `<p class="message${s.phase === "lost" ? " warn" : ""}" role="status">${s.message}</p>`;
  function comboView() {
    const s = state;
    const playing = s.phase === "playing";
    const choices = playing ? `<h2 class="section-title">두 영웅의 행동</h2><p class="help">전사가 먼저 표식을 남기고 마법사가 약점 폭발을 쓰면 연계 피해를 줍니다. 마법 집중 1을 사용합니다. 보스의 이번 반격은 ${bossAttacks[s.round]}입니다.</p>
      <div class="role-grid"><div class="card"><h3>전사</h3><p>표식 베기: 피해 2 · 약점 표시 / 방패 올리기: 받는 피해 −2</p><div class="choices">${btn("표식 베기", "combo-warrior", `data-choice="mark" aria-pressed="${s.warrior === "mark"}"`)}${btn("방패 올리기", "combo-warrior", `data-choice="guard" aria-pressed="${s.warrior === "guard"}"`)}</div></div>
      <div class="card"><h3>마법사</h3><p>마법 충전: 집중 +1 · 피해 1 / 약점 폭발: 표식·집중이 있으면 피해 ${7 + s.bonus}, 아니면 피해 2</p><div class="choices">${btn("마법 충전", "combo-mage", `data-choice="charge" aria-pressed="${s.mage === "charge"}"`)}${btn("약점 폭발", "combo-mage", `data-choice="burst" aria-pressed="${s.mage === "burst"}"`)}</div></div></div>
      <h2 class="section-title">실행 순서</h2><div class="choices">${btn("전사 먼저", "combo-order", `data-choice="warrior" aria-pressed="${s.order === "warrior"}"`)}${btn("마법사 먼저", "combo-order", `data-choice="mage" aria-pressed="${s.order === "mage"}"`)}</div><div class="actions">${btn("두 영웅 행동 확정", "combo-resolve", s.warrior && s.mage ? "" : "disabled", "primary")}</div>` : s.phase === "upgrade" ? `<h2 class="section-title">2라운드 보상</h2><div class="choices">${btn("연계 강화 · 폭발 피해 +2", "combo-upgrade", 'data-choice="power"')}${btn("응급 치료 · 체력 +3", "combo-upgrade", 'data-choice="heal"')}</div>` : s.phase === "between" ? `<div class="actions">${btn("다음 라운드", "combo-next", "", "primary")}</div>` : outcome(s.phase === "won", "보스 약점 격파", "영웅 협동 실패", `보스 체력 ${s.boss}/24 · 영웅 체력 ${s.hp}/12`);
    return `<div class="summary">${stat("라운드", `${playing ? s.round + 1 : s.phase === "won" || s.phase === "lost" ? s.round : s.round + 1} / 5`)}${stat("보스 체력", `${s.boss} / 24`)}${stat("영웅 체력", `${s.hp} / 12`)}${stat("마법 집중", s.focus)}</div>${choices}${notice(s)}`;
  }
  function escortView() {
    const s = state;
    const playing = s.phase === "playing";
    const hint = s.scout === "scan" ? `정찰 결과: 이번 안전 길은 ${safeLanes[s.stage] === "left" ? "왼쪽" : "오른쪽"}입니다.` : "정찰하지 않으면 안전한 길은 가려집니다.";
    const body = playing ? `<h2 class="section-title">정찰자 선택</h2><div class="choices">${btn("길 정찰 · 안전 길 확인", "escort-scout", `data-choice="scan" aria-pressed="${s.scout === "scan"}"`)}${btn("약초 찾기 · 부상자 체력 +2", "escort-scout", `data-choice="herb" aria-pressed="${s.scout === "herb"}"`)}</div><p class="help hint" role="status">${hint}</p>
      <h2 class="section-title">수호자 선택</h2><div class="choices">${btn("빠른 전진 · 거리 +2, 피해 +1", "escort-guardian", `data-choice="dash" aria-pressed="${s.guardian === "dash"}"`)}${btn("엄호 이동 · 거리 +1, 피해 −1", "escort-guardian", `data-choice="cover" aria-pressed="${s.guardian === "cover"}"`)}</div>
      <h2 class="section-title">이동할 길</h2><div class="choices">${btn("왼쪽 길", "escort-lane", `data-choice="left" aria-pressed="${s.lane === "left"}"`)}${btn("오른쪽 길", "escort-lane", `data-choice="right" aria-pressed="${s.lane === "right"}"`)}</div><div class="actions">${btn("두 역할 행동 확정", "escort-resolve", s.scout && s.guardian && s.lane ? "" : "disabled", "primary")}</div>` : s.phase === "upgrade" ? `<h2 class="section-title">2구간 보상</h2><div class="choices">${btn("보호 장비 · 이후 피해 −1", "escort-upgrade", 'data-choice="armor"')}${btn("응급 약초 · 부상자 체력 +3", "escort-upgrade", 'data-choice="heal"')}</div>` : s.phase === "between" ? `<div class="actions">${btn("다음 구간으로", "escort-next", "", "primary")}</div>` : outcome(s.phase === "won", "부상자 탈출 성공", "부상자 호위 실패", `탈출 거리 ${s.distance}/6 · 부상자 체력 ${s.wounded}/8`);
    const danger = s.phase === "won" || s.phase === "lost" ? "" : `<div class="card"><h3>이번 구간의 위험</h3><p>잘못된 길 피해 ${hazards[Math.min(s.stage, 4)]}, 빠른 전진 추가 피해 1. 정찰하면 안전한 길이 공개됩니다.</p></div>`;
    return `<div class="summary">${stat("구간", `${playing ? s.stage + 1 : s.phase === "won" || s.phase === "lost" ? s.stage : s.stage + 1} / 5`)}${stat("탈출 거리", `${s.distance} / 6`)}${stat("부상자 체력", `${s.wounded} / 8`)}${stat("보호 장비", s.armor ? "적용" : "없음")}</div>${danger}${body}${notice(s)}`;
  }
  function clueView() {
    const s = state;
    const door = doors[Math.min(s.door, 2)];
    const playing = s.phase === "playing";
    const eliminated = door.choices.find(x => x !== door.answer);
    const body = playing ? `<h2 class="section-title">${door.name}</h2><p class="help">각 역할의 단서 버튼을 눌러 함께 판단하세요. 두 단서를 모두 열면 정답을 고를 수 있습니다.</p><div class="role-grid"><div class="card"><h3>탐색가의 단서</h3><p>${s.revealedA ? door.a : "아직 확인 전"}</p>${btn(s.revealedA ? "단서 확인됨" : "탐색가 단서 보기", "clue-reveal", 'data-role="a"', "secondary")}</div><div class="card"><h3>서기관의 단서</h3><p>${s.revealedB ? door.b : "아직 확인 전"}</p>${btn(s.revealedB ? "단서 확인됨" : "서기관 단서 보기", "clue-reveal", 'data-role="b"', "secondary")}</div></div><h2 class="section-title">문에 새길 답</h2><div class="choices">${door.choices.map(choice => btn(choice + (s.hint && choice === eliminated ? " · 메모로 제외" : ""), "clue-answer", `data-answer="${choice}" ${s.revealedA && s.revealedB && !(s.hint && choice === eliminated) ? "" : "disabled"}`)).join("")}</div>` : s.phase === "upgrade" ? `<h2 class="section-title">첫 문 보상</h2><p class="help">다음 문을 위한 도움 하나를 선택하세요.</p><div class="choices">${btn("추가 기회 · 오답 한도 +1", "clue-upgrade", 'data-choice="chance"')}${btn("기록 메모 · 오답 하나 제외", "clue-upgrade", 'data-choice="hint"')}</div>` : outcome(s.phase === "won", "미궁 문 모두 개방", "미궁 탐사 실패", `열린 문 ${s.door}/3 · 오답 ${s.mistakes}/${s.maxMistakes}`);
    return `<div class="summary">${stat("열린 문", `${s.door} / 3`)}${stat("오답", `${s.mistakes} / ${s.maxMistakes}`)}${stat("현재 문", `${Math.min(s.door + 1, 3)} / 3`)}${stat("메모", s.hint ? "적용" : "없음")}</div>${body}${notice(s)}`;
  }
  function render() {
    const info = games[current];
    const body = !state ? `<div class="outcome"><h2>두 역할 출발 준비</h2><p>${info.detail}</p><div class="actions">${btn("게임 시작", "start", "", "primary")}</div></div>` : current === "combo" ? comboView() : current === "escort" ? escortView() : clueView();
    app.innerHTML = `<main class="shell"><div class="top"><span class="brand">SIMDA · DAILY GAMES</span><span class="date">2026.10.05 · 로컬 협동 검증용</span></div><nav class="tabs" aria-label="게임 선택">${Object.entries(games).map(([key, game]) => btn(game.title, "switch", `data-game="${key}" ${key === current ? 'aria-current="page"' : ""}`, "tab")).join("")}</nav><section class="panel"><header class="hero"><p class="eyebrow">${info.type} · 같은 기기에서 두 역할 조작</p><h1>${info.title}</h1><p>${info.detail}</p></header><div class="content">${body}</div></section><p class="footer">두 역할을 한 기기에서 번갈아 조작하는 웹 검증용 빌드입니다. 온라인 동시접속은 구현 전이며, 전문가 평가 90점 통과 전입니다.</p></main>`;
  }
  function resolveCombo() {
    const s = state;
    if (s.phase !== "playing" || !s.warrior || !s.mage) return;
    let mark = false, guard = 0, dealt = 0, combined = false;
    const actions = s.order === "warrior" ? ["warrior", "mage"] : ["mage", "warrior"];
    for (const role of actions) {
      if (role === "warrior") { if (s.warrior === "mark") { dealt += 2; mark = true; } else guard = 2; }
      else if (s.mage === "charge") { s.focus = Math.min(3, s.focus + 1); dealt += 1; }
      else if (mark && s.focus > 0) { dealt += 7 + s.bonus; s.focus--; combined = true; mark = false; }
      else dealt += 2;
    }
    s.boss = Math.max(0, s.boss - dealt);
    const retaliation = s.boss > 0 ? Math.max(0, bossAttacks[s.round] - guard) : 0;
    s.hp = Math.max(0, s.hp - retaliation);
    s.round++;
    s.message = `영웅 피해 ${dealt}${combined ? " · 연계 성공" : ""}, 보스 반격 ${retaliation}.`;
    s.warrior = null; s.mage = null;
    if (s.boss === 0) { s.phase = "won"; s.message += " 두 영웅이 보스를 쓰러뜨렸습니다."; }
    else if (s.hp === 0 || s.round >= 5) { s.phase = "lost"; s.message += s.hp === 0 ? " 영웅이 쓰러졌습니다." : " 5라운드 제한을 넘겼습니다."; }
    else if (s.round === 2) s.phase = "upgrade";
    else s.phase = "between";
  }
  function resolveEscort() {
    const s = state;
    if (s.phase !== "playing" || !s.scout || !s.guardian || !s.lane) return;
    const correct = s.lane === safeLanes[s.stage];
    const base = correct ? 0 : hazards[s.stage];
    const pace = s.guardian === "dash" ? 2 : 1;
    const extra = s.guardian === "dash" ? 1 : -1;
    const harm = Math.max(0, base + extra - s.armor);
    const healed = s.scout === "herb" ? 2 : 0;
    s.wounded = Math.max(0, Math.min(8, s.wounded + healed) - harm);
    s.distance += pace;
    s.stage++;
    s.message = `${correct ? "안전한 길" : "위험한 길"}을 통과했습니다. 치료 ${healed}, 피해 ${harm}, 이동 ${pace}.`;
    s.scout = null; s.guardian = null; s.lane = null;
    if (s.wounded === 0) { s.phase = "lost"; s.message += " 부상자를 지키지 못했습니다."; }
    else if (s.distance >= 6) { s.phase = "won"; s.message += " 출구에 도착했습니다."; }
    else if (s.stage >= 5) { s.phase = "lost"; s.message += " 5구간 안에 탈출하지 못했습니다."; }
    else if (s.stage === 2) s.phase = "upgrade";
    else s.phase = "between";
  }
  function answerClue(answer) {
    const s = state;
    if (s.phase !== "playing" || !s.revealedA || !s.revealedB) return;
    const door = doors[s.door];
    if (s.hint && answer === door.choices.find(x => x !== door.answer)) return;
    if (answer !== door.answer) {
      s.mistakes++;
      s.message = `${door.name}: 답이 맞지 않습니다. 남은 오답 기회 ${Math.max(0, s.maxMistakes - s.mistakes)}.`;
      if (s.mistakes >= s.maxMistakes) { s.phase = "lost"; s.message += " 미궁 문이 닫혔습니다."; }
      return;
    }
    s.door++;
    s.message = `${door.name}을 열었습니다. 두 단서를 합친 답이 맞았습니다.`;
    s.revealedA = false; s.revealedB = false;
    if (s.door === 3) { s.phase = "won"; s.message += " 모든 문을 열었습니다."; }
    else if (s.door === 1) s.phase = "upgrade";
  }
  app.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-action]");
    if (!target || target.disabled) return;
    const action = target.dataset.action;
    if (action === "switch") { current = target.dataset.game; history.replaceState(null, "", `?game=${current}`); state = null; render(); return; }
    if (action === "start" || action === "restart") { start(); return; }
    if (!state) return;
    if (action === "combo-warrior" && state.phase === "playing") state.warrior = target.dataset.choice;
    else if (action === "combo-mage" && state.phase === "playing") state.mage = target.dataset.choice;
    else if (action === "combo-order" && state.phase === "playing") state.order = target.dataset.choice;
    else if (action === "combo-resolve") resolveCombo();
    else if (action === "combo-next" && state.phase === "between") state.phase = "playing";
    else if (action === "combo-upgrade" && state.phase === "upgrade") { if (target.dataset.choice === "power") state.bonus = 2; else state.hp = Math.min(12, state.hp + 3); state.phase = "between"; state.message = "보상을 적용했습니다. 다음 라운드를 준비하세요."; }
    else if (action === "escort-scout" && state.phase === "playing") state.scout = target.dataset.choice;
    else if (action === "escort-guardian" && state.phase === "playing") state.guardian = target.dataset.choice;
    else if (action === "escort-lane" && state.phase === "playing") state.lane = target.dataset.choice;
    else if (action === "escort-resolve") resolveEscort();
    else if (action === "escort-next" && state.phase === "between") state.phase = "playing";
    else if (action === "escort-upgrade" && state.phase === "upgrade") { if (target.dataset.choice === "armor") state.armor = 1; else state.wounded = Math.min(8, state.wounded + 3); state.phase = "between"; state.message = "호위 장비를 적용했습니다. 다음 구간으로 이동하세요."; }
    else if (action === "clue-reveal" && state.phase === "playing") { if (target.dataset.role === "a") state.revealedA = true; else state.revealedB = true; }
    else if (action === "clue-answer") answerClue(target.dataset.answer);
    else if (action === "clue-upgrade" && state.phase === "upgrade") { if (target.dataset.choice === "chance") state.maxMistakes++; else state.hint = true; state.phase = "playing"; state.message = "첫 문 보상을 적용했습니다. 다음 역할의 단서를 확인하세요."; }
    render();
  });
  window.addEventListener("popstate", () => { const next = new URLSearchParams(location.search).get("game"); current = Object.hasOwn(games, next) ? next : "combo"; state = null; render(); });
  render();
})();
