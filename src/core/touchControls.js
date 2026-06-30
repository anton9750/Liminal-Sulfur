// src/core/touchControls.js
// Mobile touch input layer: a virtual joystick (move), a drag-to-look
// surface (camera rotation), and tap buttons (sprint / flashlight).
// Built with Pointer Events so it works for touch and pen alike,
// and stays completely separate from the desktop keyboard/mouse path
// in PlayerController.

export function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

const JOYSTICK_RADIUS = 50; // px the knob can travel from center

export class TouchControls {
  /**
   * @param {import('./controls.js').PlayerController} player
   * @param {{ onFlashlight?: () => void }} [opts]
   */
  constructor(player, opts = {}) {
    this.player = player;
    this.opts = opts;
    this.lookTouchId = null;
    this.joyTouchId  = null;
    this._lastLook = { x: 0, y: 0 };

    this._buildDom();
    this._bindJoystick();
    this._bindLook();
    this._bindButtons();
  }

  _buildDom() {
    const root = document.createElement('div');
    root.id = 'touchControls';
    root.innerHTML = `
      <div id="touchLookLayer"></div>
      <div id="touchJoystickZone">
        <div id="touchJoystickBase">
          <div id="touchJoystickKnob"></div>
        </div>
      </div>
      <div id="touchButtons">
        <button id="touchFlashlightBtn" type="button" aria-label="Toggle flashlight">💡</button>
        <button id="touchSprintBtn" type="button" aria-label="Hold to run">RUN</button>
      </div>
    `;
    document.body.appendChild(root);

    this.el           = root;
    this.lookLayer    = root.querySelector('#touchLookLayer');
    this.joyZone      = root.querySelector('#touchJoystickZone');
    this.joyBase      = root.querySelector('#touchJoystickBase');
    this.joyKnob      = root.querySelector('#touchJoystickKnob');
    this.flashlightBtn = root.querySelector('#touchFlashlightBtn');
    this.sprintBtn     = root.querySelector('#touchSprintBtn');
  }

  show() { this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none'; }

  _bindJoystick() {
    const resetKnob = () => {
      this.joyKnob.style.transform = 'translate(-50%, -50%)';
    };
    resetKnob();

    const handleMove = (clientX, clientY) => {
      const rect = this.joyBase.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > JOYSTICK_RADIUS) {
        dx = (dx / dist) * JOYSTICK_RADIUS;
        dy = (dy / dist) * JOYSTICK_RADIUS;
      }
      this.joyKnob.style.transform = `translate(${dx - 24}px, ${dy - 24}px)`;

      const nx = dx / JOYSTICK_RADIUS;
      const ny = dy / JOYSTICK_RADIUS;
      // Screen-up (negative ny) should mean "forward" => z negative,
      // matching the KeyW convention used in PlayerController.
      this.player.setVirtualMove(nx, ny);
    };

    this.joyZone.addEventListener('pointerdown', (e) => {
      if (this.joyTouchId !== null) return;
      this.joyTouchId = e.pointerId;
      this.joyZone.setPointerCapture(e.pointerId);
      handleMove(e.clientX, e.clientY);
      e.preventDefault();
    });

    this.joyZone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joyTouchId) return;
      handleMove(e.clientX, e.clientY);
      e.preventDefault();
    });

    const end = (e) => {
      if (e.pointerId !== this.joyTouchId) return;
      this.joyTouchId = null;
      this.player.setVirtualMove(0, 0);
      resetKnob();
    };
    this.joyZone.addEventListener('pointerup', end);
    this.joyZone.addEventListener('pointercancel', end);
  }

  _bindLook() {
    this.lookLayer.addEventListener('pointerdown', (e) => {
      if (this.lookTouchId !== null) return;
      this.lookTouchId = e.pointerId;
      this._lastLook.x = e.clientX;
      this._lastLook.y = e.clientY;
      this.lookLayer.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    this.lookLayer.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.lookTouchId) return;
      const dx = e.clientX - this._lastLook.x;
      const dy = e.clientY - this._lastLook.y;
      this._lastLook.x = e.clientX;
      this._lastLook.y = e.clientY;
      // Touch drag sensitivity is tuned separately from mouse-look since
      // finger drags cover far fewer raw pixels per intended turn amount.
      this.player.lookBy(dx * 2.4, dy * 2.4);
      e.preventDefault();
    });

    const end = (e) => {
      if (e.pointerId !== this.lookTouchId) return;
      this.lookTouchId = null;
    };
    this.lookLayer.addEventListener('pointerup', end);
    this.lookLayer.addEventListener('pointercancel', end);
  }

  _bindButtons() {
    this.flashlightBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.player.toggleFlashlight();
      if (this.opts.onFlashlight) this.opts.onFlashlight();
    });

    const setSprint = (on) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.player.setTouchSprint(on);
    };
    this.sprintBtn.addEventListener('pointerdown', setSprint(true));
    this.sprintBtn.addEventListener('pointerup', setSprint(false));
    this.sprintBtn.addEventListener('pointercancel', setSprint(false));
    this.sprintBtn.addEventListener('pointerleave', setSprint(false));
  }
}
