/* Has Legs: the brief builder.
   Everything typed here stays in the visitor's own browser. The brief only
   travels when they send it themselves, from their own email. */
(function () {
  "use strict";

  var form = document.getElementById("brief-form");
  if (!form) { return; }

  var KEY = "haslegs.brief.v2";
  var MAX_LINK = 1800; /* some mail programmes drop longer mailto links */

  var cfg = { email: form.getAttribute("data-email") };

  var $ = function (id) { return document.getElementById(id); };
  var list = $("pieces");
  var statusBox = $("brief-status");
  var examples = ["Flyer", "Banner advert", "PowerPoint", "Letterhead", "Business card", "Wayfinding signage", "Email signature"];
  var specExamples = ["A5, printed, handed out at the open day", "728 x 90 and 300 x 250, on our website", "16:9, about 20 slides, for the staff update", "A4, printed, and for Word", "90 x 50 mm, printed both sides", "1200 x 600 mm, printed, at reception", "For Outlook, about 40 people"];

  /* ---- Piece rows ---- */

  function syncRows() {
    var rows = list.children;
    for (var i = 0; i < rows.length; i++) {
      rows[i].querySelector(".piece-remove").disabled = rows.length === 1;
      rows[i].querySelector('[name="piece_name"]').placeholder = examples[i % examples.length];
      rows[i].querySelector('[name="piece_spec"]').placeholder = specExamples[i % specExamples.length];
    }
  }

  function addPiece(data, focus) {
    var row = document.createElement("li");
    row.className = "piece";
    row.innerHTML =
      '<label>Piece<input class="input" type="text" name="piece_name" list="catalogue-items" autocomplete="off"></label>' +
      '<label>Size, and where it will be used<input class="input" type="text" name="piece_spec" autocomplete="off"></label>' +
      '<label>How many<input class="input" type="number" name="piece_qty" min="1" max="9999" step="1" value="1" inputmode="numeric"></label>' +
      '<button type="button" class="piece-remove" aria-label="Remove this piece"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>';
    if (data) {
      row.querySelector('[name="piece_name"]').value = data.name || "";
      row.querySelector('[name="piece_spec"]').value = data.spec || "";
      row.querySelector('[name="piece_qty"]').value = data.qty || 1;
    }
    list.appendChild(row);
    syncRows();
    if (focus) { row.querySelector('[name="piece_name"]').focus(); }
  }

  /* ---- Reading the form ---- */

  function field(name) {
    var el = form.elements[name];
    return el && typeof el.value === "string" ? el.value.trim() : "";
  }

  function read() {
    var pieces = [].map.call(list.children, function (row) {
      var qty = parseInt(row.querySelector('[name="piece_qty"]').value, 10);
      return {
        name: row.querySelector('[name="piece_name"]').value.trim(),
        spec: row.querySelector('[name="piece_spec"]').value.trim(),
        qty: qty > 0 ? qty : 1
      };
    });
    return {
      name: field("name"),
      company: field("company"),
      role: field("role") || "brand",
      mode: field("mode"),
      reference: field("reference"),
      link: field("reference_link"),
      approver: field("approver"),
      guidelines: field("guidelines"),
      pieces: pieces,
      copy: field("copy"),
      specs: field("specs"),
      due: field("due"),
      notes: field("notes")
    };
  }

  function countOf(state) {
    return state.pieces.filter(function (piece) { return piece.name; }).length;
  }

  function countWords(count) {
    return count === 0 ? "No pieces yet" : count === 1 ? "1 piece" : count + " pieces";
  }

  function niceDate(value) {
    var parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!parts) { return value; }
    var date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return days[date.getDay()] + " " + date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
  }

  /* ---- The brief, as plain text ---- */

  function compose(state) {
    var named = state.pieces.filter(function (piece) { return piece.name; });
    var lines = [];
    var yesNo = function (value, yes, no) {
      return value === "yes" ? yes : value === "no" ? no : "Not answered yet.";
    };

    lines.push("Hello Has Legs,", "", "Here is our brief.", "");
    lines.push("FROM");
    lines.push((state.name || "(name)") + (state.company ? ", " + state.company : ""));
    if (state.role === "agency") {
      var modes = {
        referral: "We are an agency and would like to refer this job to you.",
        whitelabel: "We are an agency and would like this white-labelled: we deliver it under our own name.",
        unsure: "We are an agency. Referral or white-label still to be decided."
      };
      lines.push(modes[state.mode] || modes.unsure);
    } else {
      lines.push("We are a brand or marketing team.");
    }
    lines.push("Approver: " + (state.approver || "me, " + (state.name || "(name)")));

    lines.push("", "1. THE REFERENCE");
    lines.push(state.reference || "(to come)");
    if (state.link) { lines.push("Link: " + state.link); }

    lines.push("", "2. BRAND GUIDELINES");
    lines.push(state.guidelines === "none"
      ? "We have none. Please work the rules out from our website and the reference."
      : yesNo(state.guidelines, "In hand. Attached or linked with this email.", "Not to hand yet. We are getting them from our agency."));

    lines.push("", "3. WHAT WE NEED NEXT (" + (named.length === 1 ? "1 piece" : named.length + " pieces") + ")");
    named.forEach(function (piece, index) {
      lines.push((index + 1) + ". " + piece.name + (piece.spec ? ": " + piece.spec : "") + (piece.qty > 1 ? " (x" + piece.qty + ")" : ""));
    });

    lines.push("", "4. COPY AND SPECIFICATIONS");
    lines.push("Final copy: " + yesNo(state.copy, "Final and signed off.", "Still to come."));
    lines.push("Specifications: " + yesNo(state.specs, "In hand.", "Still to come."));

    lines.push("", "5. BY WHEN");
    lines.push(state.due ? niceDate(state.due) : "No date given.");

    if (state.notes) { lines.push("", "ANYTHING ELSE", state.notes); }

    lines.push("", "Thanks,", state.name || "");
    return lines.join("\n");
  }

  function subjectOf(state) {
    var count = countOf(state);
    return "Brief for Has Legs: " + (state.company || "new brief") + " (" + (count === 1 ? "1 piece" : count + " pieces") + ")";
  }

  /* ---- Live summary ---- */

  function listWords(words) {
    if (words.length < 2) { return words.join(""); }
    return words.slice(0, -1).join(", ") + " and " + words[words.length - 1];
  }

  function render() {
    var state = read();

    $("agency-mode").hidden = state.role !== "agency";
    $("guidelines-note").hidden = state.guidelines !== "no";
    $("guidelines-none-note").hidden = state.guidelines !== "none";

    $("sum-size").textContent = countWords(countOf(state));

    /* A brand with no guidelines can still start: we write the rules down ourselves. */
    var clock = {
      reference: Boolean(state.reference),
      guidelines: state.guidelines === "yes" || state.guidelines === "none",
      copy: state.copy === "yes",
      specs: state.specs === "yes"
    };
    var names = { reference: "the reference", guidelines: "brand guidelines", copy: "final copy", specs: "specifications" };
    var missing = [];
    Object.keys(clock).forEach(function (key) {
      var item = document.querySelector('[data-clock="' + key + '"]');
      if (item) {
        item.classList.toggle("in", clock[key]);
        item.querySelector(".state").textContent = !clock[key] ? "To come" :
          (key === "guidelines" && state.guidelines === "none") ? "We'll write them" : "In hand";
      }
      if (!clock[key]) { missing.push(names[key]); }
    });
    var verdict = $("clock-verdict");
    if (!missing.length) {
      verdict.innerHTML = "<strong>Nothing missing.</strong> We can send your job sheet straight away.";
    } else {
      verdict.innerHTML = "<strong>Still to come:</strong> " + listWords(missing) + ". Send the brief now, and the rest when you have it.";
    }

    $("brief-preview").textContent = "To: " + cfg.email + "\nSubject: " + subjectOf(state) + "\n\n" + compose(state);
    return state;
  }

  /* ---- Remembering the draft on this device ---- */

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(read())); } catch (err) { /* private window: carry on */ }
  }

  function setRadio(name, value) {
    [].forEach.call(form.querySelectorAll('input[name="' + name + '"]'), function (input) {
      input.checked = input.value === value;
    });
  }

  function restore() {
    var saved = null;
    try { saved = JSON.parse(window.localStorage.getItem(KEY) || "null"); } catch (err) { saved = null; }
    if (!saved || typeof saved !== "object") { return false; }
    form.elements.name.value = saved.name || "";
    form.elements.company.value = saved.company || "";
    setRadio("role", saved.role === "agency" ? "agency" : "brand");
    setRadio("mode", saved.mode || "");
    form.elements.approver.value = saved.approver || "";
    form.elements.reference.value = saved.reference || "";
    form.elements.reference_link.value = saved.link || "";
    setRadio("guidelines", saved.guidelines || "");
    setRadio("copy", saved.copy || "");
    setRadio("specs", saved.specs || "");
    form.elements.due.value = saved.due || "";
    form.elements.notes.value = saved.notes || "";
    list.innerHTML = "";
    (Array.isArray(saved.pieces) && saved.pieces.length ? saved.pieces : [null]).forEach(function (piece) { addPiece(piece, false); });
    return true;
  }

  /* ---- Checking before it goes ---- */

  function clearInvalid() {
    [].forEach.call(form.querySelectorAll('[aria-invalid="true"]'), function (el) { el.removeAttribute("aria-invalid"); });
  }

  function validate(state) {
    var problems = [];
    if (!state.name) { problems.push({ el: form.elements.name, text: "your name" }); }
    if (!state.company) { problems.push({ el: form.elements.company, text: "your company" }); }
    if (!state.reference) { problems.push({ el: form.elements.reference, text: "what the reference is" }); }
    if (!state.pieces.some(function (piece) { return piece.name; })) {
      problems.push({ el: list.querySelector('[name="piece_name"]'), text: "at least one piece" });
    }
    clearInvalid();
    if (!problems.length) { return true; }
    problems.forEach(function (problem) { problem.el.setAttribute("aria-invalid", "true"); });
    say("Before this can go, add " + listWords(problems.map(function (problem) { return problem.text; })) + ".", true);
    problems[0].el.focus();
    return false;
  }

  function say(text, bad) {
    statusBox.textContent = text;
    statusBox.classList.toggle("bad", Boolean(bad));
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      document.body.removeChild(area);
      if (ok) { resolve(); } else { reject(new Error("copy failed")); }
    });
  }

  function mailLink(subject, body) {
    return "mailto:" + cfg.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body).replace(/%0A/g, "%0D%0A");
  }

  /* ---- Buttons ---- */

  $("send-brief").addEventListener("click", function () {
    var state = render();
    if (!validate(state)) { return; }
    var body = compose(state);
    var link = mailLink(subjectOf(state), body);
    var after = "Your email should open with the brief filled in. Attach your reference, brand guidelines and specifications, then send. Nothing opened? Copy the brief and email it to " + cfg.email + ".";
    if (link.length > MAX_LINK) {
      link = mailLink(subjectOf(state), "Hello Has Legs,\n\n(Paste the brief here. It is on your clipboard.)\n\nThanks,\n" + state.name);
      after = "This brief is too long to hand to your email in one go, so it has been copied. Your email should open: paste the brief into it, attach your files, then send to " + cfg.email + ".";
      copyText(body).then(function () { say(after, false); }, function () {
        say("Your email should open. Use Copy the brief, paste it in, attach your files, then send to " + cfg.email + ".", false);
      });
    } else {
      say(after, false);
    }
    var opener = document.createElement("a");
    opener.href = link;
    opener.style.display = "none";
    document.body.appendChild(opener);
    opener.click();
    document.body.removeChild(opener);
  });

  $("copy-brief").addEventListener("click", function () {
    var state = render();
    if (!validate(state)) { return; }
    copyText(compose(state)).then(function () {
      say("Copied. Paste it into an email to " + cfg.email + " and attach your files.", false);
    }, function () {
      say("Your browser would not copy it. Open Preview the email below and copy the text from there.", true);
    });
  });

  $("download-brief").addEventListener("click", function () {
    var state = render();
    if (!validate(state)) { return; }
    var text = "To: " + cfg.email + "\r\nSubject: " + subjectOf(state) + "\r\n\r\n" + compose(state).replace(/\n/g, "\r\n") + "\r\n";
    var url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "has-legs-brief.txt";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    say("Saved as has-legs-brief.txt. Email it to " + cfg.email + " with your files.", false);
  });

  $("reset-brief").addEventListener("click", function () {
    try { window.localStorage.removeItem(KEY); } catch (err) { /* nothing stored */ }
    form.reset();
    list.innerHTML = "";
    addPiece(null, false);
    clearInvalid();
    say("", false);
    render();
    form.elements.name.focus();
  });

  $("add-piece").addEventListener("click", function () {
    addPiece(null, true);
    render();
    save();
  });

  list.addEventListener("click", function (event) {
    var button = event.target.closest(".piece-remove");
    if (!button || button.disabled) { return; }
    button.closest(".piece").remove();
    syncRows();
    render();
    save();
  });

  var onEdit = function (event) {
    if (event.target && event.target.removeAttribute) { event.target.removeAttribute("aria-invalid"); }
    if (statusBox.classList.contains("bad")) { say("", false); }
    render();
    save();
  };
  form.addEventListener("input", onEdit);
  form.addEventListener("change", onEdit);
  form.addEventListener("submit", function (event) { event.preventDefault(); });

  /* ---- Start ---- */

  var hadDraft = restore();
  if (!hadDraft) { addPiece(null, false); }

  /* A link from the catalogue arrives with its piece already on the list. */
  var query = new URLSearchParams(window.location.search);
  var item = (query.get("item") || "").trim().slice(0, 60);
  if (item) {
    var names = [].map.call(list.querySelectorAll('[name="piece_name"]'), function (input) { return input.value.trim(); });
    if (names.indexOf(item) === -1) {
      var empty = names.indexOf("");
      if (empty === -1) { addPiece({ name: item }, false); } else { list.children[empty].querySelector('[name="piece_name"]').value = item; }
      save();
    }
  }
  if (query.get("from") === "agency") { setRadio("role", "agency"); }

  render();
})();
