// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* ==========================================================================
   Projects 3D — build-in-3D + WebXR AR buildables for the unit culminating
   projects. Companion to projects-3d.css. SAME contract as the VISUALS/PRO/
   GOLD layers:

     • Only activates on <body class="pro-projects"> pages.
     • Purely additive & defensive: every feature try/caught, every DOM lookup
       guarded; missing element/config = silent no-op, never a throw.
     • Idempotent: re-running (or double-injection) is a no-op.
     • Never touches the page's own globals or inputs.
     • Self-contained: three.js from the vendored /assets/vendor/three-0.160.0
       ESM build. No external CDN. Own minimal orbit controls + WebXR helper —
       the vendored copy ships build/ only (no examples/jsm).

   How it works: fetches the page's ./build3d.json —

     { "version": 1,
       "builds": [ { "step": "step-3", "kind": "net-box",
                     "title": { "en": "…", "es": "…" },
                     "why":   { "en": "…", "es": "…" },
                     "data":  { "unit": "in", "min": 1, "max": 12,
                                "default": [6, 4, 3] } } ] }

   — then per build inserts a bilingual "Build It in 3D" card with a
   <div class="p3d-mount" data-kind="…"> into the named step panel (above nav).
   three.js + the matching build3d-<kind>.js builder are lazy-loaded the first
   time a card scrolls into view (IntersectionObserver) so non-3D pages pay
   nothing. Builders self-register via window.P3D.registerKind(name, factory).

   Injected by tools/inject-projects-3d.mjs (sentinel: projects-3d).
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  if (window.__p3dBooted) return;
  window.__p3dBooted = true;

  var THREE_URL = "/assets/vendor/three-0.160.0/build/three.module.js";

  /* Whitelist — only these builders may mount. Builder files register into the
     same registry; a kind not listed here is ignored even if a file registers. */
  var KINDS = { "net-box": 1, "data-bars": 1, "floor-plan": 1, "coord-map": 1, "tile-extrude": 1 };

  var COPY = {
    badge: { en: "Build it in 3D — no grade", es: "Constrúyelo en 3D — sin nota" },
    ar: { en: "📱 Walk your model (AR)", es: "📱 Recorre tu modelo (RA)" },
    reset: { en: "↺ Reset", es: "↺ Reiniciar" },
    hint: {
      en: "Drag to rotate • scroll or pinch to zoom • arrow keys also rotate.",
      es: "Arrastra para girar • desplaza o pellizca para acercar • las flechas también giran.",
    },
    noWebGL: {
      en: "3D preview needs WebGL — the tool above still works. Try a newer browser to build in 3D.",
      es: "La vista 3D necesita WebGL — la herramienta de arriba funciona. Prueba un navegador más nuevo para construir en 3D.",
    },
  };

  var lang = function () {
    return (document.documentElement.getAttribute("lang") || "en").slice(0, 2) === "es"
      ? "es"
      : "en";
  };
  var t = function (obj) {
    if (!obj) return "";
    return obj[lang()] || obj.en || "";
  };

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  /* ---- lazy singletons -------------------------------------------------- */
  var threePromise = null;
  function loadThree() {
    if (threePromise) return threePromise;
    threePromise = import(THREE_URL).catch(function (e) {
      threePromise = null;
      throw e;
    });
    return threePromise;
  }
  var builderPromises = {};
  function loadBuilder(kind) {
    if (builderPromises[kind]) return builderPromises[kind];
    var url = "/shared/projects/build3d-" + kind + ".js";
    builderPromises[kind] = import(url).catch(function (e) {
      builderPromises[kind] = null;
      throw e;
    });
    return builderPromises[kind];
  }

  function webglOK() {
    try {
      var c = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (c.getContext("webgl") || c.getContext("experimental-webgl"))
      );
    } catch (_e) {
      return false;
    }
  }

  /* ---- minimal orbit controls (pointer + wheel + pinch + arrows) -------- */
  function orbit(camera, dom, opts) {
    opts = opts || {};
    var target = opts.target || { x: 0, y: 0, z: 0 };
    var radius = opts.radius || 8,
      minR = opts.minR || 3,
      maxR = opts.maxR || 24;
    var theta = opts.theta != null ? opts.theta : Math.PI * 0.25; // azimuth
    var phi = opts.phi != null ? opts.phi : Math.PI * 0.35; // polar (0..PI)
    var dragging = false,
      lx = 0,
      ly = 0,
      pinchD = 0;

    function apply() {
      phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi));
      radius = Math.max(minR, Math.min(maxR, radius));
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target.x, target.y, target.z);
    }
    function down(e) {
      if (e.touches && e.touches.length === 2) {
        pinchD = dist2(e.touches);
        return;
      }
      dragging = true;
      var p = point(e);
      lx = p.x;
      ly = p.y;
    }
    function move(e) {
      if (e.touches && e.touches.length === 2) {
        var d = dist2(e.touches);
        if (pinchD) radius *= pinchD / d;
        pinchD = d;
        apply();
        e.preventDefault();
        return;
      }
      if (!dragging) return;
      var p = point(e);
      theta -= (p.x - lx) * 0.01;
      phi -= (p.y - ly) * 0.01;
      lx = p.x;
      ly = p.y;
      apply();
      e.preventDefault();
    }
    function up() {
      dragging = false;
      pinchD = 0;
    }
    function wheel(e) {
      radius *= e.deltaY > 0 ? 1.1 : 0.9;
      apply();
      e.preventDefault();
    }
    function key(e) {
      var k = e.key;
      if (k === "ArrowLeft") theta -= 0.15;
      else if (k === "ArrowRight") theta += 0.15;
      else if (k === "ArrowUp") phi -= 0.12;
      else if (k === "ArrowDown") phi += 0.12;
      else return;
      apply();
      e.preventDefault();
    }
    function point(e) {
      var s = e.touches ? e.touches[0] : e;
      return { x: s.clientX, y: s.clientY };
    }
    function dist2(tt) {
      var a = tt[0],
        b = tt[1];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }
    dom.addEventListener("mousedown", down);
    dom.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    dom.addEventListener("touchstart", down, { passive: true });
    dom.addEventListener("touchmove", move, { passive: false });
    dom.addEventListener("touchend", up);
    dom.addEventListener("wheel", wheel, { passive: false });
    dom.setAttribute("tabindex", "0");
    dom.addEventListener("keydown", key);
    apply();
    return {
      update: apply,
      setTarget: function (x, y, z) {
        target = { x: x, y: y, z: z };
        apply();
      },
      setRadius: function (r) {
        radius = r;
        maxR = Math.max(maxR, r * 1.6);
        apply();
      },
      dispose: function () {
        window.removeEventListener("mouseup", up);
      },
    };
  }

  /* ---- WebXR AR: feature-detected, defensive ---------------------------- */
  var arSupport = null;
  function arSupported() {
    if (arSupport != null) return Promise.resolve(arSupport);
    if (!navigator.xr || !navigator.xr.isSessionSupported) {
      arSupport = false;
      return Promise.resolve(false);
    }
    return navigator.xr
      .isSessionSupported("immersive-ar")
      .then(function (ok) {
        arSupport = !!ok;
        return arSupport;
      })
      .catch(function () {
        arSupport = false;
        return false;
      });
  }
  /* startAR(THREE, buildModel): buildModel() returns a fresh Object3D sized in
     metres. Richer AR — surface hit-test with a reticle: aim the phone at a real
     surface and a green ring snaps to it; tap to place the model there; tap again
     to move it, or nudge-rotate once it's placed. Falls back to a fixed 0.6 m
     drop when hit-test is unavailable. Fully guarded; any failure ends silently. */
  function startAR(THREE, buildModel) {
    if (!navigator.xr) return;
    navigator.xr
      .requestSession("immersive-ar", {
        requiredFeatures: ["local"],
        optionalFeatures: ["hit-test", "dom-overlay", "local-floor"],
      })
      .then(function (session) {
        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.xr.enabled = true;
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.setReferenceSpaceType("local");
        renderer.xr.setSession(session);

        var scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(0xffffff, 0x666688, 1.15));
        var dir = new THREE.DirectionalLight(0xffffff, 0.85);
        dir.position.set(1, 2, 1);
        scene.add(dir);
        var camera = new THREE.PerspectiveCamera();

        var model = buildModel();
        model.visible = false;
        scene.add(model);

        // reticle — a flat ring that snaps to detected surfaces
        var reticle = new THREE.Mesh(
          new THREE.RingGeometry(0.055, 0.075, 28).rotateX(-Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0x2ecc71 }),
        );
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add(reticle);

        var hitSource = null,
          placed = false,
          fellBack = false;
        try {
          session
            .requestReferenceSpace("viewer")
            .then(function (viewerSpace) {
              if (session.requestHitTestSource) {
                var p = session.requestHitTestSource({ space: viewerSpace });
                if (p && p.then)
                  p.then(function (src) {
                    hitSource = src;
                  }).catch(function () {});
              }
            })
            .catch(function () {});
        } catch (_e) {}

        session.addEventListener("select", function () {
          if (reticle.visible) {
            model.position.setFromMatrixPosition(reticle.matrix); // place / move
            model.visible = true;
            placed = true;
          } else if (placed) {
            model.rotation.y += Math.PI / 8; // nudge-rotate once placed
          }
        });

        renderer.setAnimationLoop(function (_, frame) {
          if (!frame) return;
          if (hitSource) {
            var refSpace = renderer.xr.getReferenceSpace();
            var hits = frame.getHitTestResults(hitSource);
            if (hits.length) {
              var pose = hits[0].getPose(refSpace);
              if (pose) {
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
              }
            } else {
              reticle.visible = false;
            }
          } else if (!fellBack && !placed) {
            fellBack = true; // no hit-test available — drop ahead so AR still works
            model.position.set(0, 0, -0.6);
            model.visible = true;
            placed = true;
          }
          renderer.render(scene, camera);
        });

        session.addEventListener("end", function () {
          renderer.setAnimationLoop(null);
          try {
            if (hitSource && hitSource.cancel) hitSource.cancel();
          } catch (_e) {}
          try {
            renderer.dispose();
          } catch (_e) {}
        });
      })
      .catch(function () {
        /* user declined / not available — silent */
      });
  }

  /* ---- stage factory: renderer + scene + orbit, resize + destroy -------- */
  function makeStage(THREE, holder, o) {
    o = o || {};
    var renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if ("outputColorSpace" in renderer && THREE.SRGBColorSpace)
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
    }
    renderer.shadowMap.enabled = true;
    if (THREE.PCFSoftShadowMap) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    holder.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    // studio lighting: soft hemisphere ambient + shadow-casting key + fill + rim
    scene.add(new THREE.HemisphereLight(0xf3f7ff, 0x8794a8, 0.95));
    var key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(6, 15, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 4;
    key.shadow.bias = -0.0004;
    var sc = key.shadow.camera;
    sc.near = 0.5;
    sc.far = 90;
    sc.left = sc.bottom = -26;
    sc.right = sc.top = 26;
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xdfe8ff, 0.45);
    fill.position.set(-9, 7, -4);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xffffff, 0.35);
    rim.position.set(-3, 5, -11);
    scene.add(rim);

    // soft contact ground — ShadowMaterial shows only where shadows fall, so the
    // CSS backdrop shows through everywhere else. Builders align it via setGroundY.
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.ShadowMaterial({ opacity: 0.24 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    var camera = new THREE.PerspectiveCamera(42, 4 / 3, 0.1, 200);
    var ctrl = orbit(camera, holder, { radius: o.radius || 10, target: o.target, phi: o.phi });
    var raf = 0;
    function size() {
      var w = holder.clientWidth || 320,
        h = holder.clientHeight || 240;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    function loop() {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    size();
    var ro = null;
    try {
      ro = new ResizeObserver(size);
      ro.observe(holder);
    } catch (_e) {}
    window.addEventListener("resize", size);
    loop();
    return {
      THREE: THREE,
      renderer: renderer,
      scene: scene,
      camera: camera,
      controls: ctrl,
      resize: size,
      ground: ground,
      setGroundY: function (y) {
        ground.position.y = y;
      },
      castShadows: function (obj) {
        if (obj && obj.traverse)
          obj.traverse(function (n) {
            if (n.isMesh) n.castShadow = true;
          });
      },
      snapshot: function () {
        try {
          renderer.render(scene, camera);
          return renderer.domElement.toDataURL("image/png");
        } catch (_e) {
          return null;
        }
      },
      destroy: function () {
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        window.removeEventListener("resize", size);
        try {
          renderer.dispose();
        } catch (_e) {}
      },
    };
  }

  /* ---- public API for builder files ------------------------------------ */
  window.P3D = {
    THREE_URL: THREE_URL,
    lang: lang,
    t: t,
    el: el,
    loadThree: loadThree,
    orbit: orbit,
    makeStage: makeStage,
    arSupported: arSupported,
    startAR: startAR,
    _kinds: {},
    registerKind: function (name, factory) {
      this._kinds[name] = factory;
    },
    copy: COPY,
    /* Builds a labelled −/+ stepper; calls onChange(value) on every change. */
    stepper: function (label, val, min, max, onChange) {
      var f = el("div", "p3d-field");
      var lab = el("label", null, label);
      f.appendChild(lab);
      var row = el("div", "p3d-step");
      var minus = el("button", "p3d-btn", "−");
      var input = el("input");
      input.type = "text";
      input.inputMode = "numeric";
      input.value = String(val);
      input.setAttribute("aria-label", label);
      var plus = el("button", "p3d-btn", "+");
      function set(v) {
        v = Math.max(min, Math.min(max, v | 0));
        input.value = String(v);
        minus.disabled = v <= min;
        plus.disabled = v >= max;
        onChange(v);
      }
      minus.addEventListener("click", function () {
        set((parseInt(input.value, 10) || min) - 1);
      });
      plus.addEventListener("click", function () {
        set((parseInt(input.value, 10) || min) + 1);
      });
      input.addEventListener("change", function () {
        set(parseInt(input.value, 10) || min);
      });
      row.appendChild(minus);
      row.appendChild(input);
      row.appendChild(plus);
      f.appendChild(row);
      set(val);
      return f;
    },
  };

  /* ---- mount cards from build3d.json ------------------------------------ */
  function insertCard(build) {
    var panel = document.getElementById(build.step);
    if (!panel) return;
    var card = el("section", "p3d-card");
    card.setAttribute("data-p3d-kind", build.kind);
    card.appendChild(el("span", "p3d-badge", t(COPY.badge)));
    if (build.title) card.appendChild(el("h4", null, t(build.title)));
    if (build.why) card.appendChild(el("p", "p3d-why", t(build.why)));
    var mount = el("div", "p3d-mount");
    mount.setAttribute("data-kind", build.kind);
    card.appendChild(mount);
    /* insert above the step's nav buttons if present, else append */
    var nav = panel.querySelector(".step-nav, .wizard-nav, .pki-nav, nav");
    if (nav && nav.parentNode === panel) panel.insertBefore(card, nav);
    else panel.appendChild(card);
    observe(mount, build);
  }

  function isVisible(node) {
    return !!(node && (node.offsetWidth || node.offsetHeight || node.getClientRects().length));
  }
  /* Mount the builder once the card actually has layout. In the project pages
     each wizard step is display:none until the student navigates to it, so an
     IntersectionObserver alone never fires (a hidden step is never "intersecting")
     and the card would sit blank. We therefore mount on the FIRST of: the step
     becoming visible (MutationObserver on the step's style/class), the card
     scrolling into view (IntersectionObserver), or a short visibility poll — and
     only when the mount has real size, so the WebGL canvas is sized correctly. */
  function observe(mount, build) {
    mount.__p3dBuild = build;
    var localIO = null,
      mo = null,
      poll = 0,
      done = false;
    function fire() {
      if (done || !isVisible(mount)) return;
      done = true;
      if (localIO) localIO.disconnect();
      if (mo) mo.disconnect();
      if (poll) {
        clearInterval(poll);
        poll = 0;
      }
      mountBuilder(mount, build);
    }
    if ("IntersectionObserver" in window) {
      localIO = new IntersectionObserver(
        function (es) {
          for (var i = 0; i < es.length; i++)
            if (es[i].isIntersecting) {
              fire();
              break;
            }
        },
        { rootMargin: "200px" },
      );
      localIO.observe(mount);
    }
    var step = document.getElementById(build.step);
    if (step && "MutationObserver" in window) {
      mo = new MutationObserver(fire);
      mo.observe(step, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
    }
    poll = setInterval(fire, 300);
    setTimeout(function () {
      if (poll && !done) {
        clearInterval(poll);
        poll = 0;
      }
    }, 20000);
    fire();
  }

  function mountBuilder(mount, build) {
    if (mount.__p3dMounted) return;
    mount.__p3dMounted = true;
    if (!webglOK()) {
      mount.appendChild(el("div", "p3d-fallback", t(COPY.noWebGL)));
      return;
    }
    Promise.all([loadThree(), loadBuilder(build.kind)])
      .then(function (res) {
        var THREE = res[0];
        var factory = window.P3D._kinds[build.kind];
        if (typeof factory !== "function") return;
        factory(THREE, mount, build.data || {}, window.P3D);
      })
      .catch(function (_e) {
        try {
          mount.appendChild(el("div", "p3d-fallback", t(COPY.noWebGL)));
        } catch (_) {}
      });
  }

  function boot() {
    try {
      if (!document.body || !document.body.classList.contains("pro-projects")) return;
      fetch("./build3d.json", { cache: "no-cache" })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (cfg) {
          if (!cfg || !Array.isArray(cfg.builds)) return;
          cfg.builds.forEach(function (b) {
            if (b && b.step && b.kind && KINDS[b.kind]) {
              try {
                insertCard(b);
              } catch (_e) {}
            }
          });
        })
        .catch(function () {});
    } catch (_e) {}
  }

  ready(boot);
})();
