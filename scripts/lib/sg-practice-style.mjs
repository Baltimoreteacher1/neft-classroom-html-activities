// Print stylesheet for the small-group Practice Sets (scripts/generate-sg-practice.mjs).
//
// Kept out of the generator so the generator reads as content, not CSS. The
// palette, the Fraunces/Hanken pairing and the paper ground are the same
// editorial identity every other generated document here uses — see
// scripts/lib/editorial-print.mjs, whose overrides are appended after this.
//
// The class prefix is `sp-` (small-group practice), deliberately distinct from
// the `ws-` worksheet prefix so the two documents can never inherit each
// other's rules. The two answer-key classes `ws-correct` and `ws-keynote` are
// the exception: tools/validate-worksheet-audience.mjs detects a key leaking
// onto a student page by those exact names, and a private alias would make the
// student page look clean to a gate that had stopped looking.

export const SG_PRACTICE_CSS = `
:root{
  --navy:#143a6b; --blue:#1f5fa6; --teal:#1c7a64; --ink:#19262f; --muted:#4c5b6a;
  --line:#d7e2ed; --soft:#eef3f9; --bank:#fff8e8; --bank-line:#f0d9a0;
  --model:#eaf4ff; --model-line:#c4dcf5; --warn:#fff3e6; --warn-line:#e08a3c;
  --paper:#f5f0e6;
}
*{box-sizing:border-box;}
body{margin:0;background:#e9eef5;color:var(--ink);
  font-family:"Hanken Grotesk",system-ui,-apple-system,sans-serif;font-size:13.5px;line-height:1.52;}

/* ---- page ---- */
.sp-page{background:#fff;max-width:760px;margin:18px auto;padding:32px 40px 40px;
  box-shadow:0 6px 24px rgba(20,40,75,.12);border-radius:6px;position:relative;}
.sp-head{border-bottom:3px solid var(--navy);padding-bottom:12px;margin-bottom:16px;}
.sp-eyebrow{display:flex;justify-content:space-between;align-items:center;gap:12px;
  flex-wrap:wrap;margin-bottom:6px;}
.sp-std{background:var(--navy);color:#fff;font-weight:700;font-size:11px;letter-spacing:.045em;
  padding:4px 11px;border-radius:999px;white-space:nowrap;}
.sp-level{font-family:"Fraunces",Georgia,serif;font-weight:700;color:var(--blue);font-size:13.5px;}
.sp-kicker{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
  color:var(--teal);margin:0 0 2px;}
.sp-title{font-family:"Fraunces",Georgia,serif;font-weight:700;font-size:25px;margin:0 0 3px;
  color:var(--navy);line-height:1.12;}
.sp-sub{margin:0;color:var(--muted);font-weight:600;font-size:12.5px;}
.sp-meta{display:flex;gap:26px;margin-top:12px;font-weight:600;font-size:12.5px;flex-wrap:wrap;}
.sp-fill{display:inline-block;width:210px;border-bottom:1.5px solid var(--ink);}
.sp-fill-sm{width:110px;}
.sp-foot{margin-top:22px;padding-top:8px;border-top:1px solid var(--line);display:flex;
  justify-content:space-between;font-size:10.5px;color:var(--muted);font-weight:600;}

/* ---- section framing ---- */
.sp-section{margin:0 0 6px;}
.sp-sec-h{font-family:"Fraunces",Georgia,serif;font-size:15px;color:var(--navy);
  margin:18px 0 8px;display:flex;align-items:center;gap:8px;}
.sp-sec-h::after{content:"";flex:1;height:1px;background:var(--line);}
.sp-sec-note{margin:-4px 0 10px;font-size:11.5px;color:var(--muted);font-style:italic;}

/* ---- recap + model ---- */
.sp-recap{background:var(--soft);border:1.5px solid var(--line);border-left:5px solid var(--teal);
  border-radius:0 12px 12px 0;padding:11px 15px;margin:0 0 14px;}
.sp-recap-h{font-family:"Fraunces",Georgia,serif;font-size:13.5px;margin:0 0 4px;color:var(--navy);}
.sp-recap p{margin:3px 0;font-size:12.5px;}
.sp-model{background:var(--model);border:1.5px solid var(--model-line);border-radius:12px;
  padding:12px 16px;margin:0 0 14px;}
.sp-model-h{font-family:"Fraunces",Georgia,serif;font-size:14px;margin:0 0 8px;color:var(--navy);}
.sp-model-steps{list-style:none;margin:0;padding:0;counter-reset:sp-step;}
.sp-model-steps li{display:flex;gap:10px;padding:4px 0;align-items:baseline;}
.sp-model-steps li::before{counter-increment:sp-step;content:counter(sp-step);flex:0 0 auto;
  width:19px;height:19px;border-radius:50%;background:var(--blue);color:#fff;font-weight:700;
  font-size:11px;display:inline-flex;align-items:center;justify-content:center;}
.sp-model-last{font-weight:700;color:var(--navy);}

/* ---- word bank ---- */
.sp-bank{background:var(--bank);border:1.5px solid var(--bank-line);border-radius:12px;
  padding:11px 15px;margin:0 0 14px;}
.sp-bank-h{font-family:"Fraunces",Georgia,serif;font-size:13.5px;margin:0 0 7px;color:var(--navy);}
.sp-bankwords{display:flex;flex-wrap:wrap;gap:7px;}
.sp-word{background:#fff;border:1.5px solid var(--bank-line);border-radius:999px;padding:3px 11px;
  font-weight:700;font-size:12px;}
.sp-word-es{font-weight:500;color:var(--muted);font-style:italic;}

/* ---- tasks ---- */
.sp-tasks{list-style:none;margin:0;padding:0;}
.sp-task{display:flex;gap:11px;padding:12px 0;border-bottom:1px dashed var(--line);
  break-inside:avoid;page-break-inside:avoid;}
.sp-task:last-child{border-bottom:0;}
.sp-num{flex:0 0 auto;width:25px;height:25px;border-radius:50%;background:var(--navy);color:#fff;
  font-weight:700;display:flex;align-items:center;justify-content:center;font-size:12.5px;}
.sp-body{flex:1;min-width:0;}
.sp-stem{margin:0 0 6px;font-weight:600;}
.sp-tag{display:inline-block;background:var(--soft);border:1px solid var(--line);border-radius:6px;
  padding:1px 7px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  color:var(--muted);margin-right:6px;vertical-align:1px;}
.sp-opts{list-style:none;margin:6px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;
  gap:5px 18px;}
.sp-opt{display:flex;align-items:flex-start;gap:7px;}
.sp-bub{flex:0 0 auto;width:21px;height:21px;border:2px solid var(--navy);border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:11.5px;}
.ws-correct .sp-bub{background:var(--teal);border-color:var(--teal);color:#fff;}
.ws-correct{font-weight:700;color:var(--teal);}
.sp-frame{background:var(--soft);border-left:3px solid var(--blue);padding:5px 10px;margin:6px 0 0;
  font-style:italic;color:var(--muted);border-radius:0 8px 8px 0;font-size:12px;}
.sp-lines{margin:7px 0 0;}
.sp-line{display:block;border-bottom:1.5px solid var(--line);height:23px;}
.sp-work{margin:7px 0 0;border:1.5px dashed var(--line);border-radius:10px;min-height:68px;
  padding:5px 10px;}
.sp-work-tall{min-height:118px;}
.sp-work-label{color:var(--muted);font-size:10.5px;font-weight:600;}
.sp-cloze{list-style:none;margin:0;padding:0;}
.sp-cloze li{padding:6px 0;border-bottom:1px dotted var(--line);font-weight:600;}
.sp-cloze li:last-child{border-bottom:0;}
.sp-sort{list-style:none;margin:6px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;
  gap:5px 16px;}
.sp-sort li{display:flex;align-items:center;gap:8px;font-weight:600;font-size:12.5px;}
.sp-blank{display:inline-block;min-width:46px;border-bottom:1.5px solid var(--ink);
  text-align:center;font-weight:700;}
.sp-mistake{background:var(--warn);border:1.5px solid #f0cba4;border-left:5px solid var(--warn-line);
  border-radius:0 10px 10px 0;padding:9px 13px;margin:0 0 7px;font-size:12.5px;}
.sp-mistake b{color:#9a4a12;}
.sp-westart{background:var(--soft);border:1.5px solid var(--line);border-left:5px solid var(--blue);
  border-radius:0 10px 10px 0;padding:9px 13px;margin:0 0 7px;font-size:12.5px;}
.sp-westart b{color:var(--navy);}

/* ---- self check ---- */
.sp-check{border:1.5px solid var(--line);border-radius:12px;overflow:hidden;margin:12px 0 0;}
.sp-check table{width:100%;border-collapse:collapse;}
.sp-check th{background:var(--navy);color:#fff;font-size:11px;padding:6px 9px;text-align:left;
  font-weight:700;letter-spacing:.03em;}
.sp-check th:not(:first-child){text-align:center;width:88px;}
.sp-check td{border-top:1px solid var(--line);padding:8px 9px;font-size:12.5px;font-weight:600;}
.sp-check td:not(:first-child){text-align:center;}
.sp-box{display:inline-block;width:15px;height:15px;border:1.5px solid var(--navy);border-radius:3px;}
.sp-ask{margin:12px 0 0;background:var(--soft);border:1.5px solid var(--line);border-radius:12px;
  padding:10px 14px;}
.sp-ask-h{font-weight:700;font-size:12.5px;color:var(--navy);margin:0 0 4px;}

/* ---- teacher key only ---- */
.ws-keynote{margin:6px 0 0;color:var(--teal);font-size:11.5px;font-style:italic;}
.sp-watch{margin:4px 0 0;color:#9a4a12;font-size:11.5px;background:var(--warn);
  border-left:3px solid var(--warn-line);padding:5px 10px;border-radius:0 8px 8px 0;}
.sp-reteach{width:100%;border-collapse:collapse;margin:10px 0 0;font-size:12px;}
.sp-reteach th{background:var(--navy);color:#fff;padding:6px 9px;text-align:left;font-size:11px;}
.sp-reteach td{border:1px solid var(--line);padding:8px 9px;vertical-align:top;}
.sp-reteach td:first-child{width:34%;font-weight:700;color:var(--navy);}

@media print{
  body{background:#fff;font-size:12pt;}
  .sp-page{box-shadow:none;border-radius:0;margin:0;max-width:none;padding:0;
    page-break-after:always;}
  .sp-page:last-child{page-break-after:auto;}
  @page{margin:1.4cm;}
  a{color:#000;text-decoration:none;}
}
`;
