// Photography learning topics — trusted, author-edited content, not recipe data.
// Add a topic to this list; renderLearn() gives each one a native disclosure.
// Keep this file declarations-only so it can load before personal-ui.js.
const LEARN_TOPICS = [
  {
    id: 'fuji-multiple-exposure',
    title: 'Multi-Exposure (Fujifilm)',
    subtitle: 'Layer photographs in-camera — from subtle ghosts to graphic silhouettes.',
    tags: ['X-T50', 'X-M5', 'Creative technique'],
    demo: 'multiple-exposure',
    body: `
      <section class="learn-section">
        <h3>One image, several moments</h3>
        <p>Multiple exposure combines two or more shots into one photograph in-camera. It is not a burst, HDR, or a longer shutter exposure: each frame can show a different subject or composition. The blend mode decides how the frames overlap.</p>
        <div class="learn-callout"><strong>Your cameras:</strong> Both the X-T50 and X-M5 support <strong>up to nine exposures</strong> and all four modes below. Start with two. Older Fujifilm models can have different limits and controls — follow the manual for the specific body.</div>
      </section>

      <section class="learn-section">
        <h3>See the blend</h3>
        <p>Keep the original clean-background silhouette, or switch Frame A to a colored, textured wall with uneven light. Frame B stays the same so you can compare the effect of the background alone. Change the blend mode and exposure to see which details survive.</p>
        <div class="learn-demo" data-multi-exposure-demo>
          <div class="learn-controls">
            <label>Frame A background
              <select data-blend-background>
                <option value="clean">Clean / near-white</option>
                <option value="textured">Colored / textured wall</option>
              </select>
            </label>
            <label>Blend mode
              <select data-blend-mode>
                <option value="average">Average</option>
                <option value="additive">Additive</option>
                <option value="bright">Bright</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>Exposure of each frame
              <span class="learn-exposure-control"><input data-blend-ev type="range" min="-2" max="0" step="0.5" value="0" aria-label="Exposure adjustment for both frames"><output data-blend-ev-label>0 EV</output></span>
            </label>
          </div>
          <div class="learn-frame-grid">
            <figure><canvas data-frame="a" width="360" height="240" role="img" aria-label="Frame A: dark portrait silhouette on a light background">Dark silhouette against a light background.</canvas><figcaption><strong>Frame A</strong> · <span data-blend-background-name>clean background</span></figcaption></figure>
            <figure><canvas data-frame="b" width="360" height="240" role="img" aria-label="Frame B: bright leaves on a dark background">Bright botanical pattern against a dark background.</canvas><figcaption><strong>Frame B</strong> · texture</figcaption></figure>
            <figure><canvas data-frame="result" width="360" height="240" role="img" aria-label="Combined multiple exposure illustration">Combined exposure; see the explanation below.</canvas><figcaption><strong>Result</strong> · <span data-blend-name>Average</span></figcaption></figure>
          </div>
          <p class="learn-demo-explanation" data-blend-explanation aria-live="polite"></p>
          <div class="learn-callout"><strong>The background does not have to be white.</strong> What matters is brightness separation. With a textured, midtone background, Bright can let leaves appear outside the silhouette too, while Dark can keep the wall’s dark details. A clean bright background simply makes the subject-shaped effect easier to control. Colored layers can also shift the combined hues.</div>
          <p class="learn-small">Conceptual illustration, not a Fujifilm rendering simulator. This uses simple RGB arithmetic (sum, mean, max, min); the camera’s exposure optimization, color processing and tone curve can produce different results. EV here only scales the illustrated pixel values.</p>
        </div>
      </section>

      <section class="learn-section">
        <h3>On the X-T50 / X-M5</h3>
        <ol class="learn-steps">
          <li><strong>Prepare the look.</strong> Choose a film simulation or recipe, a deliberate WB, and your exposure settings. Keep the look consistent for your first experiment. A tripod helps when layers need to line up; handheld works well for abstract compositions.</li>
          <li><strong>Enter the mode.</strong> Press <kbd>DRIVE</kbd> → <strong>MULTIPLE EXPOSURE</strong>, then choose <strong>AVERAGE</strong>, <strong>ADDITIVE</strong>, <strong>BRIGHT</strong>, or <strong>DARK</strong>.</li>
          <li><strong>Make frame one.</strong> Shoot, then press <kbd>MENU/OK</kbd> to accept it. The first shot is superimposed on the live view so you can compose the next frame. Push the focus stick <strong>left</strong> to retake it. <kbd>DISP/BACK</kbd> here saves the first shot and exits without a composite.</li>
          <li><strong>Add frame two.</strong> Use the overlay to place the second subject. Shoot and press <kbd>MENU/OK</kbd> to accept. Push the focus stick <strong>left</strong> if this layer needs a retake.</li>
          <li><strong>Finish or keep layering.</strong> After two or more shots, press <kbd>DISP/BACK</kbd> to finish the composite, or add more exposures (up to nine). Inspect the result and select your normal drive mode when you are done.</li>
        </ol>
      </section>

      <section class="learn-section">
        <h3>Choose the right blend</h3>
        <div class="learn-mode-grid">
          <article class="learn-mode-card"><h4>Average <span>Start here</span></h4><p>Balances the exposures automatically. In this illustration: <code>(A + B) / 2</code>. An unchanged background stays roughly as bright, while moving subjects can become transparent.</p><p><strong>Try:</strong> lock the camera in place, photograph an empty scene, then a person in it. For two positions of the same person, have them move between frames.</p></article>
          <article class="learn-mode-card"><h4>Additive <span>Light accumulates</span></h4><p>Adds light from each frame: <code>A + B</code>. Overlapping highlights can clip; dark areas contribute less light. Unlike Average, the camera does not simply normalize the total for you.</p><p><strong>Try:</strong> neon signs, light trails, or a sharp scene plus a defocused light layer. For two similarly bright frames, <strong>−1 EV per frame</strong> is a useful starting point; for N equal frames, about <code>−log₂(N) EV</code>. Adjust using the preview, not the formula alone.</p></article>
          <article class="learn-mode-card"><h4>Bright <span>Brighter areas win</span></h4><p>Favors the brighter pixel at each location. Bright areas in the first shot tend to stay; darker areas leave room for brighter details from the next layer. Color interactions can be more complex than a simple cutout.</p><p><strong>Try:</strong> a dark silhouette against a bright sky, then bright foliage or texture against a darker background. This is the mode to explore for a texture-filled silhouette.</p></article>
          <article class="learn-mode-card"><h4>Dark <span>Darker areas win</span></h4><p>Favors the darker pixel at each location. A dark shape can survive over a lighter scene; bright space is replaceable by darker detail from another frame.</p><p><strong>Try:</strong> dark lettering or branches on a light background, then a lighter architectural scene. Think graphic marks and intersecting shapes rather than a transparent overlay.</p></article>
        </div>
      </section>

      <section class="learn-section">
        <h3>First exercise: portrait × leaves</h3>
        <ol class="learn-steps">
          <li>Choose <strong>BRIGHT</strong>. Put a person in shade against a bright, uncluttered sky. Expose to retain the bright background while keeping the person relatively dark.</li>
          <li>Accept frame one. Find sunlit leaves or a bright pattern against a darker background; use the ghost overlay to align the texture with the silhouette.</li>
          <li>Accept frame two and finish. If the face disappears, try a subtler second layer or a different framing. Repeat in <strong>AVERAGE</strong> to compare a softer, transparent overlap.</li>
        </ol>
      </section>

      <details class="learn-troubleshooting">
        <summary>Troubleshooting &amp; field reminders</summary>
        <ul>
          <li><strong>Washed-out result?</strong> In Additive, reduce exposure for the individual frames or use Average. Clipped highlights cannot be recovered just by changing the blend.</li>
          <li><strong>Second layer barely shows?</strong> In Bright it must beat the first frame’s brightness at that location; in Dark it must be darker. Look for intentional bright/dark separation.</li>
          <li><strong>Muddy or confusing layers?</strong> Use one clear main subject and one simple texture. Leave negative space. Two busy, equally strong frames tend to compete.</li>
          <li><strong>Alignment drifts?</strong> Use a tripod and the live overlay. For repeating subjects, keep the camera fixed and move the subject instead.</li>
          <li><strong>Unexpected color?</strong> Start with one consistent WB and film simulation. Bright/Dark can mix colors according to brightness and hue, not just select an entire object.</li>
          <li><strong>Need originals for later editing?</strong> Do not assume the composite behaves like a layered RAW file or that every source is retained. Check actual saved files on your body; make separate normal-drive shots if the originals matter.</li>
        </ul>
      </details>
      <footer class="learn-sources">Camera controls and limits verified against Fujifilm’s manuals:
        <a href="https://fujifilm-dsc.com/en/manual/x-t50/taking_photo/multi-exp/" target="_blank" rel="noopener noreferrer">X-T50 · Multiple Exposures ↗</a>
        <a href="https://fujifilm-dsc.com/en/manual/x-m5/taking_photo/multi-exp/" target="_blank" rel="noopener noreferrer">X-M5 · Multiple Exposures ↗</a>
      </footer>`,
  },
  {
    id: 'metering',
    title: 'Metering',
    subtitle: 'Where the camera measures light — and why the “correct” exposure may not be the one you want.',
    tags: ['Exposure', 'Fujifilm', 'OM System'],
    demo: 'metering',
    body: `
      <section class="learn-section">
        <h3>The meter measures light, not intent</h3>
        <p>Metering evaluates reflected light and recommends an exposure. The camera cannot always tell whether a bright area is white snow that should stay bright, or a grey object under strong light. A dark scene may be deliberately dark. Metering mode chooses <strong>which areas influence that recommendation</strong>; exposure compensation tells the camera to place them brighter or darker.</p>
        <div class="learn-callout"><strong>Start simple:</strong> use Fujifilm <strong>Multi</strong> or OM <strong>Digital ESP</strong> for everyday shooting. Check the subject, histogram, and highlight warnings; use compensation before changing metering mode without a clear reason.</div>
      </section>

      <section class="learn-section">
        <h3>See what the meter pays attention to</h3>
        <p>Compare a broad average, a center-biased reading, and a spot reading in the same scene. For Spot, try the person, the bright background, and the shadows. Then add compensation. The gold outline shows the sampled area or the area given extra weight — not the autofocus target.</p>
        <div class="learn-demo" data-metering-demo>
          <div class="learn-controls">
            <label>Scene
              <select data-metering-scene>
                <option value="backlit">Backlit portrait</option>
                <option value="snow">Snow / bright scene</option>
                <option value="night">Night / dark scene</option>
              </select>
            </label>
            <label>Metering approach
              <select data-metering-mode>
                <option value="average">Whole-frame average</option>
                <option value="center">Center-weighted</option>
                <option value="spot">Spot</option>
              </select>
            </label>
            <label>Spot target (Spot only)
              <select data-metering-target disabled>
                <option value="subject">Person</option>
                <option value="background">Background</option>
                <option value="shadow">Shadow patch</option>
              </select>
            </label>
            <label>Exposure compensation
              <span class="learn-exposure-control"><input data-metering-comp type="range" min="-2" max="2" step="0.5" value="0" aria-label="Metering demo exposure compensation"><output data-metering-comp-label>0 EV</output></span>
            </label>
          </div>
          <div class="learn-frame-grid learn-metering-frames">
            <figure><canvas data-metering-frame="map" width="360" height="240" role="img" aria-label="Scene with the metering region outlined in gold">Scene and metering region.</canvas><figcaption><strong>Where it measures</strong> · <span data-metering-region>entire frame</span></figcaption></figure>
            <figure><canvas data-metering-frame="result" width="360" height="240" role="img" aria-label="Illustrated exposure from the selected metering approach">Illustrated exposure result.</canvas><figcaption><strong>Exposure result</strong> · <span data-metering-adjustment></span></figcaption></figure>
          </div>
          <p class="learn-demo-explanation" data-metering-explanation aria-live="polite"></p>
          <p class="learn-small">Conceptual illustration, not a camera simulator. Three linear-light tone zones are measured with fixed teaching weights, then the reading is mapped to an illustrative 18% midtone before compensation. Outlines are enlarged for clarity. Actual scene analysis, metering calibration, dynamic range and JPEG processing differ; proprietary Multi/ESP behavior is deliberately not simulated.</p>
        </div>
      </section>

      <section class="learn-section">
        <h3>Choose a mode deliberately</h3>
        <div class="learn-mode-grid">
          <article class="learn-mode-card"><h4>Multi / Digital ESP <span>Everyday default</span></h4><p>Analyzes areas across the frame, rather than just taking a simple average. Composition, brightness, and camera-specific scene or subject logic can influence the result.</p><p><strong>Use for:</strong> travel, street, family, and changing light. Fuji calls it Multi; OM calls it Digital ESP. They serve a similar purpose but are not identical algorithms.</p></article>
          <article class="learn-mode-card"><h4>Center-weighted <span>Give the center more influence</span></h4><p>Meters the whole frame but gives the middle extra weight. Useful when the subject is near the center and background brightness should have less influence.</p><p><strong>Watch:</strong> an off-center subject can still be underexposed or overexposed. The weighted region is not automatically your chosen AF point.</p></article>
          <article class="learn-mode-card"><h4>Spot <span>Meter a specific tone</span></h4><p>Reads a small area, so the tone you point it at strongly determines exposure. Metering a bright window generally lowers exposure; metering a dark jacket generally raises it.</p><p><strong>Watch:</strong> an ordinary spot meter tends to place its sampled tone near a midtone. White fabric may need positive compensation; black fabric may need negative compensation. Skin is not one universal mid-grey tone.</p></article>
          <article class="learn-mode-card"><h4>Average (Fujifilm) <span>Whole-frame average, not Multi</span></h4><p>Uses an average across the frame without Multi’s scene analysis. It can give predictable readings for similar compositions under the same lighting.</p><p><strong>Watch:</strong> changing the amount of bright sky or dark foreground changes the average. It does not guarantee a good exposure for the subject.</p></article>
        </div>
      </section>

      <section class="learn-section">
        <h3>On your cameras</h3>
        <details class="learn-troubleshooting" open>
          <summary>Fujifilm X-T50 / X-M5</summary>
          <ul>
            <li><strong>Menu:</strong> SHOOTING SETTING → <strong>PHOTOMETRY</strong> → Multi / Center Weighted / Spot / Average.</li>
            <li><strong>Detection caveat:</strong> these manuals say the selected photometry option only takes effect when both <strong>FACE/EYE DETECTION SETTING</strong> and <strong>SUBJECT DETECTION SETTING</strong> are Off. Turn them off when comparing modes; re-enable detection for normal people/subject shooting if you need it.</li>
            <li><strong>Spot position:</strong> AF/MF SETTING → <strong>INTERLOCK SPOT AE &amp; FOCUS AREA</strong> → On meters at the selected focus area. Check that setting rather than assuming the spot follows every AF mode or detection box.</li>
            <li><strong>Lock and recompose:</strong> use a button assigned to AE LOCK when you want to retain a reading. Verify the AE-lock indication and the button’s hold/toggle behavior before reframing.</li>
          </ul>
        </details>
        <details class="learn-troubleshooting">
          <summary>OM System OM-3 (and PEN-F terminology)</summary>
          <ul>
            <li><strong>OM-3 access:</strong> press OK for the Super Control Panel → <strong>Metering</strong>, or MENU → photo tab → <strong>5. Metering → Metering</strong>.</li>
            <li><strong>Modes:</strong> Digital ESP / Center-weighted averaging / Spot / <strong>Spot Hi</strong> / <strong>Spot SH</strong>. The PEN-F uses the same family of metering names; its menu layout differs from the OM-3.</li>
            <li><strong>Spot Hi:</strong> increases the spot-based exposure to keep a bright sampled subject bright. <strong>Spot SH:</strong> lowers it to keep a dark sampled subject dark. These are not automatic “protect every highlight” or “recover every shadow” modes.</li>
            <li><strong>OM-3 spot position:</strong> photo tab → 5. Metering → <strong>Spot Metering</strong> configures metering at the selected AF target. Check restrictions for your AF/detection setup. Use a button assigned to AEL for a locked reading.</li>
          </ul>
        </details>
      </section>

      <section class="learn-section">
        <h3>What the recommendation actually changes</h3>
        <ul class="learn-steps">
          <li><strong>A / aperture priority:</strong> the camera adjusts shutter speed and, if enabled, Auto ISO to reach the target exposure.</li>
          <li><strong>S / shutter priority:</strong> it adjusts aperture and, if enabled, Auto ISO. Aperture limits may prevent the desired exposure.</li>
          <li><strong>M + Auto ISO:</strong> shutter and aperture stay fixed; ISO can respond to the meter and supported exposure compensation, within the configured limits.</li>
          <li><strong>M + fixed ISO:</strong> changing metering does not change the recorded exposure by itself. The reading changes; you must adjust shutter, aperture or ISO. Compensation alone does not create extra light with all three fixed.</li>
        </ul>
        <div class="learn-callout"><strong>+1 EV</strong> asks for one stop brighter; <strong>−1 EV</strong> asks for one stop darker. That is twice/half the exposure in the simple model, not “one brightness unit.” Check that the camera can achieve it without hitting shutter, aperture, or ISO limits.</div>
      </section>

      <section class="learn-section">
        <h3>Three field examples</h3>
        <ol class="learn-steps">
          <li><strong>Person in front of a window:</strong> start with Multi/ESP and suitable human detection. If the face is too dark, try positive compensation or a deliberate spot reading on the subject with AE lock. A correct face can still mean a blown window — a meter cannot reduce the scene’s contrast.</li>
          <li><strong>Snow or a white wall:</strong> if it looks dull grey, try about +1 EV, then inspect the highlights. The right amount depends on the scene and camera; it is not a fixed snow recipe.</li>
          <li><strong>Night street:</strong> if the camera makes the whole scene look like daylight, try negative compensation and protect important signs. Use Spot on a specific tone only when you know where you want that tone to land.</li>
        </ol>
      </section>

      <details class="learn-troubleshooting">
        <summary>Quick exercise &amp; common mistakes</summary>
        <ul>
          <li>Use the same framing in A + Auto ISO. On Fuji, turn face/subject detection Off for this comparison. Shoot Multi/ESP, Center-weighted, and Spot; note shutter speed and ISO, not just how the preview looks.</li>
          <li>Spot-meter a bright patch, a midtone, and a dark patch. Observe that the camera changes exposure in the opposite direction to the sampled brightness.</li>
          <li>Then keep one mode and bracket compensation at −1 / 0 / +1 EV. Choose the subject brightness and highlight tradeoff intentionally.</li>
          <li><strong>AF is not metering:</strong> a focus box does not guarantee exposure is measured there. Check spot linking and face/subject-detection behavior.</li>
          <li><strong>Check the histogram:</strong> the live/JPEG histogram reflects the current rendered look, not a perfect RAW clipping readout. A different film simulation or profile can change that preview.</li>
          <li><strong>For multiple exposure:</strong> evaluate each source frame deliberately. A new metering mode cannot make a busy background behave like a clean bright backdrop; brightness relationships still control the blend.</li>
        </ul>
      </details>
      <footer class="learn-sources">Controls verified against manufacturer manuals:
        <a href="https://fujifilm-dsc.com/en/manual/x-t50/taking_photo/photometry/" target="_blank" rel="noopener noreferrer">X-T50 · Metering ↗</a>
        <a href="https://fujifilm-dsc.com/en/manual/x-m5/taking_photo/photometry/" target="_blank" rel="noopener noreferrer">X-M5 · Metering ↗</a>
        <a href="https://my.omsystem.com/consumer/manuals/cameras/OM-3_MANUAL_EN.pdf#page=157" target="_blank" rel="noopener noreferrer">OM-3 · Metering, pp. 157–163 ↗</a>
      </footer>`,
  },
  {
    id: 'exposure-scenarios',
    title: 'Exposure for Scenarios',
    subtitle: 'Street, people, kids, motion, night, landscapes — practical starting settings and what to change first.',
    tags: ['Field guide', 'Exposure', 'Autofocus'],
    body: `
      <section class="learn-section">
        <h3>Start with the subject, not the ISO</h3>
        <p>These are <strong>suggested starting points</strong> for still photography, not guaranteed exposures or settings already saved on your cameras. Light, lens, focal length, subject speed, and your intended look determine the final settings. Expand a scenario below for the exposure, focus, drive, and adjustment advice.</p>
        <ol class="learn-steps">
          <li><strong>Choose shutter speed for movement.</strong> Decide whether to freeze the subject or show motion. IBIS steadies the camera, not a moving subject.</li>
          <li><strong>Choose aperture for depth of field.</strong> Decide how much of the subject or group must be sharp. Use the widest aperture your lens actually offers when light is scarce; f/1.8 is not available on an f/2.8 lens.</li>
          <li><strong>Let ISO complete the exposure.</strong> An Auto ISO ceiling is a quality preference, not a target. Use the lowest ISO that still permits the required shutter/aperture, but accept more noise rather than unintended motion blur.</li>
        </ol>
        <div class="learn-callout"><strong>Simple default:</strong> for moving subjects, try <strong>M + Auto ISO</strong> so shutter and aperture stay where you put them. For a static scene where depth of field matters most, try <strong>A / aperture priority</strong>. Use Multi / Digital ESP metering initially, then check brightness and highlight warnings.</div>
      </section>

      <section class="learn-section">
        <h3>Scenario starting points</h3>
        <p>The summary shows aperture and shutter; expand each card for ISO, AF, and field reminders. Auto ISO normally ranges from the camera’s allowed minimum to the suggested ceiling — a bright scene should not automatically be shot at ISO 6400. <strong>AF-S / AF-C</strong> below are Fuji names; use <strong>S-AF / C-AF</strong> on OM / Olympus.</p>
        <div class="learn-scenario-grid" data-exposure-scenarios></div>
      </section>

      <section class="learn-section">
        <h3>Translate the settings to your kit</h3>
        <div class="learn-mode-grid">
          <article class="learn-mode-card"><h4>AF names <span>Same intent, different labels</span></h4><p><strong>Fujifilm:</strong> AF-S / Single AF for still subjects; AF-C / Continuous AF for movement. <strong>OM / Olympus:</strong> S-AF for still subjects; C-AF for movement. MF means manual focus.</p><p>Face/eye or matching subject detection helps choose the target; it does not replace the choice of single or continuous focus. Confirm the selected eye/subject and the camera’s focus indication.</p></article>
          <article class="learn-mode-card"><h4>Lens and sensor <span>Do not copy f-numbers blindly</span></h4><p>An f-number means the same relative lens opening for exposure, but equivalent framing on M43 usually gives more depth of field than APS-C at the same f-number.</p><p>For landscapes, begin around <strong>f/5.6–f/8 on Fuji APS-C</strong> or <strong>f/4–f/5.6 on M43</strong>. Stop down if depth of field needs it, but avoid f/16 as an automatic “maximum sharpness” choice: diffraction can soften detail.</p></article>
          <article class="learn-mode-card"><h4>Stabilization <span>Static subjects only</span></h4><p>X-T50, PEN-F and OM-3 have IBIS. <strong>X-M5 has no IBIS</strong>; optical stabilization only helps if the mounted lens provides it. The slow handheld suggestions depend on a steady stance, focal length, and stabilization actually available.</p><p>For a longer lens, use a faster shutter. Without stabilization, around 1/160–1/250 at 75mm equivalent is a sensible conservative starting check. Inspect sharpness rather than trusting a universal safe speed.</p></article>
          <article class="learn-mode-card"><h4>Base ISO and recipes <span>Use the allowed minimum</span></h4><p>Normal native base ISO: <strong>X-T50 125</strong>, <strong>X-M5 160</strong>, <strong>PEN-F / OM-3 200</strong>. Use the normal range, not an extended “Low” setting just because the number is smaller.</p><p>Fuji <strong>DR200 / DR400</strong> can raise the minimum ISO. Follow the camera’s allowed value and your recipe’s DR choice rather than forcing these base numbers. RAW+JPEG gives more flexibility while learning.</p></article>
        </div>
      </section>

      <details class="learn-troubleshooting">
        <summary>When the starting settings stop working</summary>
        <ul>
          <li><strong>Subject blurred, background sharp?</strong> Raise shutter speed. A faster AF mode or stronger IBIS does not remove subject-motion blur.</li>
          <li><strong>Wrong plane sharp?</strong> Check the AF target, switch to AF-C / C-AF if distance is changing, and stop down a little if depth of field is too thin.</li>
          <li><strong>Everything smeared?</strong> Suspect camera shake, a long lens, or panning technique. Try a faster shutter and check stabilization.</li>
          <li><strong>Too dark at the ISO ceiling?</strong> In M + Auto ISO, open the aperture, allow a higher ceiling, add light, or slow the shutter only if the subject allows it. Auto ISO cannot invent the missing light.</li>
          <li><strong>A-mode shutter unexpectedly slow?</strong> An Auto ISO minimum-shutter preference is not always a hard floor once ISO reaches its limit. Watch the actual shutter, or use M + Auto ISO when that speed must stay fixed.</li>
          <li><strong>Too bright in sun?</strong> Lower ISO to the allowed minimum, increase shutter speed if motion rendering allows it, stop down if depth of field allows it, or use an ND filter. Auto ISO cannot go below the camera’s permitted minimum.</li>
          <li><strong>Indoor banding or distorted movement?</strong> Try mechanical shutter and the body’s flicker controls where available; LED lighting can still require testing. Electronic shutter can introduce banding or rolling-shutter distortion even when a fast shutter speed is selected.</li>
          <li><strong>Burst focus stops updating?</strong> Continuous AF behavior depends on the body and burst setting. A moderate burst with ongoing AF is often more useful than maximum fps with locked focus. PEN-F tracking is not equivalent to OM-3 subject detection.</li>
        </ul>
      </details>

      <section class="learn-section">
        <h3>A quick practice loop</h3>
        <p>For each scene, take a baseline frame, inspect the intended subject at high magnification, and change <strong>one variable</strong>. Try double the shutter speed for motion, one stop smaller aperture for depth of field, or ±⅔ EV for brightness when the shooting mode supports compensation. In M + fixed ISO, adjust shutter/aperture/ISO yourself; compensation alone does not change the captured exposure.</p>
        <p>For backlit people, snow, or night scenes, use the <strong>Metering</strong> lesson to decide what should stay bright or dark. A generic −⅓ or +⅓ EV is not a rule for every scenario.</p>
      </section>
      <footer class="learn-sources">The numbers above are practical recommendations, not manufacturer presets. For body-specific exposure and AF controls:
        <a href="https://fujifilm-dsc.com/en/manual/x-t50/taking_photo/shooting_mode/" target="_blank" rel="noopener noreferrer">X-T50 · Exposure modes ↗</a>
        <a href="https://fujifilm-dsc.com/en/manual/x-m5/taking_photo/autofocus/" target="_blank" rel="noopener noreferrer">X-M5 · Autofocus ↗</a>
        <a href="https://my.omsystem.com/consumer/manuals/cameras/OM-3_MANUAL_EN.pdf" target="_blank" rel="noopener noreferrer">OM-3 · Camera manual ↗</a>
      </footer>`,
    scenarios: [
      {
        id: 'street', title: 'Street / Everyday', intent: 'Freeze ordinary walkaround moments',
        mode: 'M + Auto ISO; A + Auto ISO when the scene is mostly static',
        aperture: 'f/2.8–f/5.6', shutter: '1/250–1/500 s',
        iso: 'Auto ISO, ceiling 6400; allow 12800 when keeping the shutter matters more than noise',
        af: 'AF-S for still scenes; AF-C for people walking toward or away from you',
        area: 'Small / single point for precision; Zone / group for moving people',
        drive: 'Single; short low/moderate burst for gestures',
        extras: 'Multi / Digital ESP; stabilization On where available; mechanical shutter as a safe starting point',
        adjust: ['Use f/4–f/5.6 for more scene context; open up when light drops.', 'For deliberate zone focus, switch to MF and verify the usable distance range. f/8 alone does not make every distance sharp.'],
      },
      {
        id: 'portraits', title: 'People / Portraits', intent: 'Keep the intended eye sharp',
        mode: 'A + Auto ISO while watching shutter; M + Auto ISO for a guaranteed shutter setting',
        aperture: 'f/1.8–f/2.8, lens permitting', shutter: '1/125–1/250 s still; 1/500 s for movement',
        iso: 'Auto ISO, ceiling 6400; raise if the required shutter cannot be maintained',
        af: 'AF-S for a still pose; AF-C for swaying or walking subjects',
        area: 'Face/eye detection, or a small point on the near eye when detection is unreliable',
        drive: 'Single or a short moderate burst',
        extras: 'Check eye selection, background highlights, and skin brightness; stabilization does not freeze a person',
        adjust: ['At close distance, very wide apertures can leave one eye or part of the face soft. Try f/2.8–f/4.', 'For a moving portrait, prioritize 1/500 s before lowering ISO. Use the actual maximum aperture if your lens is slower.'],
      },
      {
        id: 'groups', title: 'Groups / Family Photos', intent: 'Enough depth of field for several faces',
        mode: 'M + Auto ISO, or A + Auto ISO with a suitable minimum shutter preference',
        aperture: 'f/4–f/5.6; f/8 if multiple rows need it', shutter: '1/250 s; 1/500 s for restless groups',
        iso: 'Auto ISO, ceiling 6400; allow 12800 indoors if necessary',
        af: 'AF-S for a posed group; AF-C if people keep shifting',
        area: 'Select a useful face/focus plane deliberately; do not let the camera choose someone far behind the group',
        drive: 'Short burst to catch open eyes and good expressions',
        extras: 'Keep faces at similar distances where possible; inspect both near and far rows',
        adjust: ['Arrange the group before stopping down aggressively; aperture cannot compensate for every depth arrangement.', 'If the back row is soft, stop down or change the focus plane and spacing. If hands or faces blur, raise shutter speed instead.'],
      },
      {
        id: 'kids-pets', title: 'Kids / Pets', intent: 'Unpredictable movement and changing distance',
        mode: 'M + Auto ISO', aperture: 'f/2.8–f/4, or the widest useful opening',
        shutter: '1/500–1/1000 s; 1/1600 s for fast running',
        iso: 'Auto ISO, ceiling 6400–12800 according to light and noise tolerance',
        af: 'AF-C; continuous focus while the subject moves',
        area: 'Zone / group; face/eye or a matching animal-detection category where the body supports it',
        drive: 'Short moderate bursts with AF updating between frames',
        extras: 'Mechanical shutter initially; leave room in the frame for sudden movement',
        adjust: ['Choose shutter speed for the fastest expected movement, not the quiet moment before it.', 'If tracking grabs the background, simplify the AF area or choose the subject again. On PEN-F, use ordinary C-AF/AF-area choices rather than expecting OM-3-style animal detection.'],
      },
      {
        id: 'sports', title: 'Sports / Fast Motion', intent: 'Freeze runners, bikes, or quick gestures',
        mode: 'M + Auto ISO; S is an alternative when aperture can vary',
        aperture: 'f/2.8–f/4, or the lens’s widest useful opening', shutter: '1/1000–1/2000 s',
        iso: 'Auto ISO, ceiling 12800 as a practical starting limit',
        af: 'AF-C', area: 'Zone / group or reliable matching subject detection',
        drive: 'Continuous burst at a rate that preserves ongoing AF on the body',
        extras: 'Track before releasing; mechanical shutter first; check electronic-shutter distortion before using silent bursts',
        adjust: ['Very fast hands, wheels or nearby subjects may need 1/3200 s or faster. Slower motion may be fine at 1/500 s.', 'When light runs out, open the aperture or accept more ISO noise before giving up the shutter speed that freezes the action.'],
      },
      {
        id: 'indoor-events', title: 'Indoor Events / Candids', intent: 'People moving under mixed artificial light',
        mode: 'M + Auto ISO', aperture: 'f/1.8–f/2.8, lens permitting', shutter: '1/250–1/500 s',
        iso: 'Auto ISO, ceiling 6400–12800; test the rendering you find acceptable',
        af: 'AF-C for candids; AF-S for still posed moments', area: 'Face/eye detection or Zone for movement',
        drive: 'Single or short moderate bursts',
        extras: 'Mechanical shutter; test for banding and flicker; Auto WB initially; RAW+JPEG for mixed-light flexibility',
        adjust: ['For a still conversation, 1/125 s may work; dancing or quick gestures need more speed.', 'If lights flicker, test the body’s anti-flicker settings and shutter speeds rather than assuming silent mode will work. Avoid flash where prohibited or disruptive.'],
      },
      {
        id: 'night-people', title: 'Night / People', intent: 'Low light without blurred faces',
        mode: 'M + Auto ISO', aperture: 'Wide open, often f/1.4–f/2.8', shutter: '1/125–1/250 s; faster for movement',
        iso: 'Auto ISO, ceiling 6400–12800; permit higher only after checking the result',
        af: 'AF-S for a still person; AF-C if distance changes', area: 'Face/eye if reliable; otherwise a small point on a lit facial detail',
        drive: 'Single or short bursts',
        extras: 'Stabilization On where available; mechanical shutter under artificial light; protect important signs/highlights',
        adjust: ['A well-exposed noisy face is often more useful than a clean but blurred one. Do not choose 1/15 s merely because IBIS is available.', 'Seek better light or add permitted light if ISO reaches its ceiling. Negative compensation for night atmosphere is a choice, not a requirement to underexpose the person.'],
      },
      {
        id: 'night-static', title: 'Night / Static Handheld', intent: 'Buildings, interiors, and still details',
        mode: 'M + Auto ISO', aperture: 'f/1.8–f/2.8, lens permitting', shutter: '1/15–1/60 s with suitable stabilization; check sharpness',
        iso: 'Auto ISO, ceiling 6400; raise if a faster shutter is needed',
        af: 'AF-S; MF with magnified view if autofocus struggles', area: 'Small point on a contrast edge',
        drive: 'Single; a short burst can improve the chance of one steady frame',
        extras: 'Stable stance; stabilization On where available; avoid shutter-button jab',
        adjust: ['On X-M5 without a stabilized lens, start nearer 1/60–1/125 s, faster with longer focal lengths. Slow handheld exposures are not guaranteed on any body.', 'If people enter the scene, use the Night / People speeds instead. For deeper focus or lower ISO, use a tripod.'],
      },
      {
        id: 'landscape', title: 'Landscape / Daylight', intent: 'Depth, detail, and controlled highlights',
        mode: 'A + fixed base ISO; Auto ISO if the required shutter needs it',
        aperture: 'Fuji f/5.6–f/8; M43 f/4–f/5.6 initially', shutter: '1/125–1/250 s handheld; faster for wind or a long lens',
        iso: 'Native base where the selected DR setting permits; raise for movement or handheld sharpness',
        af: 'AF-S; MF for a fixed composition if useful', area: 'Single point at a deliberate distance; inspect foreground and background',
        drive: 'Single; self-timer on a tripod',
        extras: 'Multi / Digital ESP; watch bright sky; stabilization On handheld',
        adjust: ['For near-to-far detail, choose focus distance and aperture together. Do not automatically focus at infinity or set f/16.', 'Wind-blown foliage needs a faster shutter even on a tripod. Consider bracketing if the scene’s brightness range exceeds a single exposure.'],
      },
      {
        id: 'tripod-night', title: 'Night / Tripod Cityscape', intent: 'Static detail, low ISO, and light trails',
        mode: 'M + fixed ISO', aperture: 'f/4–f/8 as depth of field requires', shutter: '1–30 s, adjusted to the light and trail length',
        iso: 'Native base where available; no Auto ISO for this controlled baseline',
        af: 'AF-S to acquire, then MF to retain focus if needed', area: 'A lit edge; verify with magnification',
        drive: '2 s self-timer or remote release',
        extras: 'Stable tripod; usually disable stabilization on a firmly supported camera, following the body/lens guidance',
        adjust: ['Use exposure time to control trail length; check important highlights and shorten the exposure if they clip.', 'Moving people may become ghosts or disappear. Long-exposure noise reduction, if enabled, can add a second wait roughly as long as the exposure.'],
      },
      {
        id: 'panning', title: 'Panning / Motion Blur', intent: 'A readable subject with a streaked background',
        mode: 'S + low ISO; M + fixed ISO when controlling both aperture and shutter',
        aperture: 'Often f/5.6–f/11, as the light permits', shutter: '1/30–1/125 s as a first experiment',
        iso: 'Lowest normal ISO allowed; raise only if necessary',
        af: 'AF-C; pre-focus/MF for a predictable crossing point is an alternative', area: 'Zone / group on the subject',
        drive: 'Short continuous bursts while following through',
        extras: 'Mechanical shutter initially; use a supported panning stabilization mode if available, not an assumed universal setting',
        adjust: ['Start around 1/125 s and slow down as technique improves; speed, distance and direction change the useful shutter range.', 'Follow the subject smoothly before, during and after release. In bright light, use an ND filter if minimum ISO and acceptable aperture cannot accommodate the slow shutter.'],
      },
      {
        id: 'water-blur', title: 'Water / Deliberate Long Exposure', intent: 'Blur water or clouds while keeping the scene sharp',
        mode: 'M + fixed ISO', aperture: 'Fuji f/5.6–f/8; M43 f/4–f/5.6 initially', shutter: '1/4–2 s for water; longer for smoother motion',
        iso: 'Native base where the camera/DR setting permits',
        af: 'AF-S to acquire; MF to lock the focus distance', area: 'A stationary contrast edge',
        drive: '2 s self-timer or remote release',
        extras: 'Tripod; physical ND filter when needed; check stabilization guidance for tripod use',
        adjust: ['Try both shorter and longer exposures: a little water texture can be more interesting than completely smooth water.', 'OM-3 Live ND is another tool where its shooting-mode and shutter limits allow it. It is not available on every body, and it does not remove the need to inspect the result.'],
      },
      {
        id: 'wildlife', title: 'Wildlife / Birds', intent: 'Keep small, fast subjects sharp',
        mode: 'M + Auto ISO', aperture: 'Widest useful opening; stop down a little if depth of field needs it', shutter: '1/1600–1/3200 s for flight; 1/500–1/1000 s perched',
        iso: 'Auto ISO, ceiling 12800 initially; adapt to the available light',
        af: 'AF-C for movement; AF-S can work for a still perched subject', area: 'Zone / group or bird detection where supported',
        drive: 'Short bursts with continuous AF; avoid filling the buffer unnecessarily',
        extras: 'Long-lens handling matters; matching detection on supported bodies; keep the subject large enough for reliable acquisition',
        adjust: ['A perched bird can still twitch or flutter; raise shutter speed when those moments matter.', 'If the subject is tiny or obscured, use a smaller AF area or acquire focus manually before tracking. A long lens may demand faster shutter speeds than the static-subject suggestions elsewhere.'],
      },
    ],
  },
]

// Linear-light tone values for a deliberately simple metering lesson.
// These are invented teaching scenes, not measurements from photographs.
const METERING_DEMO_SCENES = {
  backlit: {
    label: 'Backlit portrait', subject: 0.22, background: 0.90, shadow: 0.06,
    tip: 'A broad reading of the bright background can lower the exposure, leaving the face dark. Prioritizing the subject brightens it relative to that reading, but may sacrifice background highlights.',
  },
  snow: {
    label: 'Snow / bright scene', subject: 0.25, background: 0.82, shadow: 0.32,
    tip: 'A broad reading can make the snow grey. Try positive compensation to keep the bright scene bright, while watching clipping.',
  },
  night: {
    label: 'Night / dark scene', subject: 0.12, background: 0.035, shadow: 0.01,
    tip: 'A broad reading can lift a dark scene more than you intend. Try negative compensation to retain the night atmosphere.',
  },
}
