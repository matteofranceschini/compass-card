import {
  LitElement,
  html,
  customElement,
  property,
  TemplateResult,
  CSSResult,
  css,
  internalProperty,
} from 'lit-element';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { CompassCardConfig } from './types';
import {
  INDICATORS,
  CONFIG_COMPASS,
  CONFIG_INDICATOR,
  CONFIG_ENTITY,
  CONFIG_SECONDARY_ENTITY,
  CONFIG_DIRECTION_OFFSET,
  CONFIG_NAME,
  CONFIG_SHOW_NORTH,
  CONFIG_DOMAINS,
} from './const';

import { localize } from './localize/localize';

@customElement('compass-card-editor')
export class CompassCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @internalProperty() private _config?: CompassCardConfig;

  public setConfig(config: CompassCardConfig): void {
    this._config = config;
  }

  get _name(): string {
    if (this._config) {
      return this._config.name || '';
    }

    return '';
  }

  get _entity(): string {
    if (this._config) {
      return this._config.entity || '';
    }

    return '';
  }

  get _secondary_entity(): string {
    if (this._config) {
      return this._config.secondary_entity || '';
    }

    return '';
  }

  get _direction_offset(): string {
    if (this._config) {
      return this._config.direction_offset || '0';
    }
    return '0';
  }

  get _compass_indicator(): string {
    if (this._config) {
      return this._config?.compass?.indicator || INDICATORS[1];
    }
    return INDICATORS[1];
  }

  get _compass_show_north(): boolean {
    if (this._config) {
      return this._config?.compass?.show_north || false;
    }
    return false;
  }

  protected render(): TemplateResult | void {
    if (!this.hass) {
      return html``;
    }

    // You can restrict on domain type
    const entities = Object.keys(this.hass.states)
      .filter((eid) => CONFIG_DOMAINS.includes(eid.substr(0, eid.indexOf('.'))))
      .sort();
    const indicatorsSorted = INDICATORS.sort();

    return html`
      <div class="card-config">
        <paper-input
          label="${localize('editor.name')} (${localize('editor.optional')})"
          .value=${this._name}
          .configValue=${CONFIG_NAME}
          @value-changed=${this._valueChanged}
        ></paper-input>
        <paper-dropdown-menu
          class="editor-entity-select"
          label="${localize('editor.primary')} ${localize('editor.entity')} (${localize('editor.required')})"
          @value-changed=${this._valueChanged}
          .configValue=${CONFIG_ENTITY}
        >
          <paper-listbox slot="dropdown-content" .selected=${entities.indexOf(this._entity)}>
            ${entities.map((entity) => {
              return html` <paper-item>${entity}</paper-item> `;
            })}
          </paper-listbox>
        </paper-dropdown-menu>
        <paper-dropdown-menu
          class="editor-entity-select"
          label="${localize('editor.secondary')} ${localize('editor.entity')} (${localize('editor.optional')})"
          @value-changed=${this._valueChanged}
          .configValue=${CONFIG_SECONDARY_ENTITY}
        >
          <paper-listbox slot="dropdown-content" .selected=${entities.indexOf(this._secondary_entity)}>
            ${entities.map((secondary_entity) => {
              return html` <paper-item>${secondary_entity}</paper-item> `;
            })}
          </paper-listbox>
        </paper-dropdown-menu>
        <paper-dropdown-menu
          class="editor-entity-select"
          label="${localize('editor.indicator')} (${localize('editor.optional')})"
          @value-changed=${this._valueChanged}
          .configValue=${CONFIG_COMPASS + '.' + CONFIG_INDICATOR}
        >
          <paper-listbox slot="dropdown-content" .selected=${indicatorsSorted.indexOf(this._compass_indicator)}>
            ${indicatorsSorted.map((indicator) => {
              return html` <paper-item>${indicator}</paper-item>`;
            })}
          </paper-listbox>
        </paper-dropdown-menu>
        <paper-input
          label="${localize('editor.direction')} ${localize('editor.offset')} (${localize('editor.optional')})"
          .value=${this._direction_offset}
          @value-changed=${this._valueChanged}
          .configValue=${CONFIG_DIRECTION_OFFSET}
        ></paper-input>
        <div class="floated-label-placeholder">${localize('editor.show')} ${localize('editor.north')}</div>
        <ha-switch
          aria-label=${`${localize('editor.toggle')} ${localize('editor.north')} ${
            this._compass_show_north ? localize('common.off') : localize('common.on')
          }`}
          .checked=${this._compass_show_north !== false}
          .configValue=${CONFIG_COMPASS + '.' + CONFIG_SHOW_NORTH}
          @change=${this._valueChanged}
          >${localize('editor.show')} ${localize('editor.north')}</ha-switch
        >
      </div>
    `;
  }

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }

    const target = ev.target;
    if (target.checked !== undefined) {
      if (this[`_${target.configValue}`] === target.checked) {
        return;
      }
    } else if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.configValue === CONFIG_COMPASS + '.' + CONFIG_INDICATOR) {
        this._config = {
          ...this._config,
          [CONFIG_COMPASS]: { ...this._config.compass, [CONFIG_INDICATOR]: target.value },
        };
      } else if (target.configValue === CONFIG_COMPASS + '.' + CONFIG_SHOW_NORTH) {
        this._config = {
          ...this._config,
          [CONFIG_COMPASS]: {
            ...this._config.compass,
            [CONFIG_SHOW_NORTH]: target.checked !== undefined ? target.checked : target.value,
          },
        };
      } else {
        this._config = {
          ...this._config,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles(): CSSResult {
    return css`
      .editor-entity-select {
        width: 100%;
      }

      ha-switch {
        padding-bottom: 8px;
      }
      .floated-label-placeholder {
        font-family: var(--paper-font-caption_-_font-family);
        -webkit-font-smoothing: var(--paper-font-caption_-_-webkit-font-smoothing);
        white-space: var(--paper-font-caption_-_white-space);
        overflow: var(--paper-font-caption_-_overflow);
        text-overflow: var(--paper-font-caption_-_text-overflow);
        font-size: var(--paper-font-caption_-_font-size);
        font-weight: var(--paper-font-caption_-_font-weight);
        letter-spacing: var(--paper-font-caption_-_letter-spacing);
        line-height: var(--paper-font-caption_-_line-height);
      }
    `;
  }
}
