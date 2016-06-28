/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const Immutable = require('immutable')
const cx = require('../lib/classSet.js')
const { getZoomValuePercentage } = require('../lib/zoom')
const config = require('../constants/config')
const appConfig = require('../constants/appConfig')
const preferenceTabs = require('../constants/preferenceTabs')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const aboutActions = require('./aboutActions')
const getSetting = require('../settings').getSetting
const SwitchControl = require('../components/switchControl')
const SortableTable = require('../components/sortableTable')

const adblock = appConfig.resourceNames.ADBLOCK
const cookieblock = appConfig.resourceNames.COOKIEBLOCK
const adInsertion = appConfig.resourceNames.AD_INSERTION
const trackingProtection = appConfig.resourceNames.TRACKING_PROTECTION
const httpsEverywhere = appConfig.resourceNames.HTTPS_EVERYWHERE
const safeBrowsing = appConfig.resourceNames.SAFE_BROWSING
const noScript = appConfig.resourceNames.NOSCRIPT
const flash = appConfig.resourceNames.FLASH

const isDarwin = navigator.platform === 'MacIntel'
const isWindows = navigator.platform && navigator.platform.includes('Win')

// TODO: Determine this from the l20n file automatically
const hintCount = 3

// Stylesheets

require('../../less/about/preferences.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

const permissionNames = ['mediaPermission',
  'geolocationPermission',
  'notificationsPermission',
  'midiSysexPermission',
  'pointerLockPermission',
  'fullscreenPermission',
  'openExternalPermission'
]

const changeSetting = (cb, key, e) => {
  if (e.target.type === 'checkbox') {
    cb(key, e.target.checked)
  } else {
    let value = e.target.value
    if (e.target.dataset && e.target.dataset.type === 'number') {
      value = parseInt(value, 10)
    } else if (e.target.dataset && e.target.dataset.type === 'float') {
      value = parseFloat(value)
    }
    if (e.target.type === 'number') {
      value = value.replace(/\D/g, '')
      value = parseInt(value, 10)
      if (Number.isNaN(value)) {
        return
      }
      value = Math.min(e.target.getAttribute('max'), Math.max(value, e.target.getAttribute('min')))
    }
    cb(key, value)
  }
}

class SettingsList extends ImmutableComponent {
  render () {
    return <div>
      {
        this.props.dataL10nId
        ? <span data-l10n-id={this.props.dataL10nId} />
        : null
      }
      <div className='settingsList'>
        {this.props.children}
      </div>
    </div>
  }
}

class SettingItem extends ImmutableComponent {
  render () {
    return <div className='settingItem'>
      <span data-l10n-id={this.props.dataL10nId} />
      {this.props.children}
    </div>
  }
}

class SettingCheckbox extends ImmutableComponent {
  render () {
    return <div style={this.props.style} className='settingItem'>
      <SwitchControl id={this.props.prefKey}
        disabled={this.props.disabled}
        onClick={this.props.onChange ? this.props.onChange : changeSetting.bind(null, this.props.onChangeSetting, this.props.prefKey)}
        checkedOn={this.props.checked !== undefined ? this.props.checked : getSetting(this.props.prefKey, this.props.settings)} />
      <label data-l10n-id={this.props.dataL10nId} htmlFor={this.props.prefKey} />
    </div>
  }
}

class GeneralTab extends ImmutableComponent {
  onSetDefaultButtonClick (event) {
    console.log('set brave as default browser')
  }
  onDataImportButtonClick (event) {
    console.log('import data to browser')
  }
  render () {
    var languageOptions = this.props.languageCodes.map(function (lc) {
      return (
        <option data-l10n-id={lc} value={lc} />
      )
    })
    const defaultLanguage = this.props.languageCodes.find((lang) => lang.includes(navigator.language)) || 'en-US'
    console.log(this.props)
    return <div>
      <div className='settingsListTitle' data-l10n-id='generalSettings' />
      <div className='pull-left column'>
        <SettingsList>
          <SettingItem dataL10nId='startsWithLabel'>
            <select value={getSetting(settings.STARTUP_MODE, this.props.settings)}
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.STARTUP_MODE)} >
              <option data-l10n-id='startsWithOptionLastTime' value='lastTime' />
              <option data-l10n-id='startsWithOptionHomePage' value='homePage' />
              <option data-l10n-id='startsWithOptionNewTabPage' value='newTabPage' />
            </select>
          </SettingItem>
          <SettingItem dataL10nId='newTabLabel'>
            <select value={getSetting(settings.STARTUP_MODE, this.props.settings)}
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.STARTUP_MODE)} >
              <option data-l10n-id='startsWithOptionLastTime' value='lastTime' />
              <option data-l10n-id='startsWithOptionHomePage' value='homePage' />
              <option data-l10n-id='startsWithOptionNewTabPage' value='newTabPage' />
            </select>
          </SettingItem>
          <SettingItem dataL10nId='homepageLabel'>
            <input data-l10n-id='homepageInput'
              value={getSetting(settings.HOMEPAGE, this.props.settings)}
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.HOMEPAGE)} />
          </SettingItem>
          <SettingItem>
            <SettingCheckbox dataL10nId='showHomeButton' prefKey={settings.SHOW_HOME_BUTTON} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          </SettingItem>
          <SettingItem>
            {
              isDarwin ? null : <SettingCheckbox dataL10nId='autoHideMenuBar' prefKey={settings.AUTO_HIDE_MENU} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
            }
          </SettingItem>
          <SettingItem>
            <SettingCheckbox dataL10nId='disableTitleMode' prefKey={settings.DISABLE_TITLE_MODE} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          </SettingItem>
        </SettingsList>
        <SettingsList>
          <SettingItem dataL10nId='selectedLanguage'>
            <select value={getSetting(settings.LANGUAGE, this.props.settings) || defaultLanguage}
              onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.LANGUAGE)} >
              {languageOptions}
            </select>
          </SettingItem>
        </SettingsList>
      </div>
      <div className='pull-left column gutter'>
        <SettingsList>
          <SettingItem dataL10nId='setDefaultLabel'>
            <span type='button' className='browserButton tactileButton' onClick={this.onSetDefaultButtonClick.bind(this)} data-l10n-id='setDefaultButton' />
          </SettingItem>
          <SettingItem>
            <SettingCheckbox dataL10nId='setDefaultAlwaysSwitch' prefKey={settings.SHOW_BOOKMARKS_TOOLBAR} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          </SettingItem>
          <SettingItem dataL10nId='importLabel'>
            <span type='button' className='browserButton tactileButton' onClick={this.onDataImportButtonClick.bind(this)} data-l10n-id='importButton' />
          </SettingItem>
        </SettingsList>
        <SettingsList>
          <SettingItem>
            <SettingCheckbox dataL10nId='bookmarkToolbarShowFavicon' prefKey={settings.SHOW_BOOKMARKS_TOOLBAR} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          </SettingItem>
        </SettingsList>
        <SettingsList>
          <SettingItem dataL10nId='braveStaysUpdated'>
            <SettingCheckbox dataL10nId='notifyOnUpdate' prefKey={settings.SHOW_BOOKMARKS_TOOLBAR} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          </SettingItem>
        </SettingsList>
      </div>
    </div>
  }
}

class SearchTab extends ImmutableComponent {
  render () {
    return <div>
      <div className='settingsListTitle' data-l10n-id='searchSettings' />
      <SortableTable headings={this.props.table.headings} rows={this.props.table.rows} />
      <div className='settingsListTitle' data-l10n-id='suggestionTypes' />
      <SettingsList>
        <SettingCheckbox dataL10nId='filterTab' prefKey={settings.OPENED_TAB_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='filterHistory' prefKey={settings.HISTORY_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='filterBookmark' prefKey={settings.BOOKMARK_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='offerSearchSuggestions' prefKey={settings.OFFER_SEARCH_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
    </div>
  }
}
SearchTab.defaultProps = {
  table: {
    headings: ['default', 'searchEngines', 'engineGoKey'],
    rows: [
      [false, 'Amazon', '/G'],
      [false, 'Bing', '/D'],
      [false, 'Duck Duck Go', '/Y'],
      [true, 'Google', '/B'],
      [false, 'Twitter', '/T'],
      [false, 'Wikipedia', '/W'],
      [false, 'Yahoo', '/A'],
      [false, 'YouTube', '/YT']
    ]
  }
}

class TabsTab extends ImmutableComponent {
  render () {
    return <div>
      <div className='settingsListTitle' data-l10n-id='tabsSettings' />
      <SettingsList>
        <SettingItem dataL10nId='tabsPerTabPage'>
          <select
            value={getSetting(settings.TABS_PER_PAGE, this.props.settings)}
            data-type='number'
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.TABS_PER_PAGE)}>
            {
              // Sorry, Brad says he hates primes :'(
              [6, 8, 10, 20].map((x) =>
                <option value={x} key={x}>{x}</option>)
            }
          </select>
        </SettingItem>
        <SettingCheckbox dataL10nId='switchToNewTabs' prefKey={settings.SWITCH_TO_NEW_TABS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='paintTabs' prefKey={settings.PAINT_TABS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='showTabPreviews' prefKey={settings.SHOW_TAB_PREVIEWS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
    </div>
  }
}

class SecurityTab extends ImmutableComponent {
  onToggleFlash (e) {
    aboutActions.setResourceEnabled(flash, e.target.checked)
  }
  render () {
    return <div>
      <div className='settingsListTitle' data-l10n-id='passwordSettings' />
      <SettingsList>
        <SettingCheckbox dataL10nId='usePasswordManager' prefKey={settings.PASSWORD_MANAGER_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='useOnePassword' prefKey={settings.ONE_PASSWORD_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='useDashlane' prefKey={settings.DASHLANE_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <div classname='settingItem'>
          <span className='linkText' data-l10n-id='managePasswords'
            onClick={aboutActions.newFrame.bind(null, {
              location: 'about:passwords'
            }, true)}></span>
        </div>
      </SettingsList>
      <SettingsList dataL10nId='pluginSettings'>
        <SettingCheckbox checked={this.props.braveryDefaults.get('flash')} dataL10nId='enableFlash' onChange={this.onToggleFlash} />
      </SettingsList>
    </div>
  }
}

class ShieldsTab extends ImmutableComponent {
  constructor () {
    super()
    this.onChangeAdControl = this.onChangeAdControl.bind(this)
    this.onToggleHTTPSE = this.onToggleSetting.bind(this, httpsEverywhere)
    this.onToggleSafeBrowsing = this.onToggleSetting.bind(this, safeBrowsing)
    this.onToggleNoScript = this.onToggleSetting.bind(this, noScript)
  }
  onChangeAdControl (e) {
    if (e.target.value === 'showBraveAds') {
      aboutActions.setResourceEnabled(adblock, true)
      aboutActions.setResourceEnabled(trackingProtection, true)
      aboutActions.setResourceEnabled(adInsertion, true)
    } else if (e.target.value === 'blockAds') {
      aboutActions.setResourceEnabled(adblock, true)
      aboutActions.setResourceEnabled(trackingProtection, true)
      aboutActions.setResourceEnabled(adInsertion, false)
    } else {
      aboutActions.setResourceEnabled(adblock, false)
      aboutActions.setResourceEnabled(trackingProtection, false)
      aboutActions.setResourceEnabled(adInsertion, false)
    }
  }
  onChangeCookieControl (e) {
    aboutActions.setResourceEnabled(cookieblock, e.target.value === 'block3rdPartyCookie')
  }
  onToggleSetting (setting, e) {
    aboutActions.setResourceEnabled(setting, e.target.checked)
  }
  render () {
    return <div id='shieldsContainer'>
      <div className='settingsListTitle' data-l10n-id='braveryDefaults' />
      <div className='pull-left column'>
        <SettingsList>
          <SettingItem dataL10nId='adControl'>
            <select value={this.props.braveryDefaults.get('adControl')} onChange={this.onChangeAdControl}>
              <option data-l10n-id='showBraveAds' value='showBraveAds' />
              <option data-l10n-id='blockAds' value='blockAds' />
              <option data-l10n-id='allowAdsAndTracking' value='allowAdsAndTracking' />
            </select>
          </SettingItem>
        </SettingsList>
        <SettingsList>
          <SettingCheckbox checked={this.props.braveryDefaults.get('httpsEverywhere')} dataL10nId='httpsEverywhere' onChange={this.onToggleHTTPSE} />
          <SettingCheckbox checked={this.props.braveryDefaults.get('safeBrowsing')} dataL10nId='safeBrowsing' onChange={this.onToggleSafeBrowsing} />
          <SettingCheckbox checked={this.props.braveryDefaults.get('noScript')} dataL10nId='noScript' onChange={this.onToggleNoScript} />
          <SettingCheckbox dataL10nId='blockCanvasFingerprinting' prefKey={settings.BLOCK_CANVAS_FINGERPRINTING} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          <SettingCheckbox dataL10nId='doNotTrack' prefKey={settings.DO_NOT_TRACK} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        </SettingsList>
        <SitePermissionsPage siteSettings={this.props.siteSettings} />
      </div>
      <div className='pull-left column gutter'>
        <SettingsList>
          <SettingItem dataL10nId='cookieControl'>
            <select value={this.props.braveryDefaults.get('cookieControl')} onChange={this.onChangeCookieControl}>
              <option data-l10n-id='block3rdPartyCookie' value='block3rdPartyCookie' />
              <option data-l10n-id='allowAllCookies' value='allowAllCookies' />
            </select>
          </SettingItem>
        </SettingsList>
      </div>
    </div>
  }
}

class SyncTab extends ImmutableComponent {
  render () {
    return <div>
      <SettingsList dataL10nId='passwordSettings'>
        <SettingCheckbox dataL10nId='usePasswordManager' prefKey={settings.PASSWORD_MANAGER_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='useOnePassword' prefKey={settings.ONE_PASSWORD_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='useDashlane' prefKey={settings.DASHLANE_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <div classname='settingItem'>
          <span className='linkText' data-l10n-id='managePasswords'
            onClick={aboutActions.newFrame.bind(null, {
              location: 'about:passwords'
            }, true)}></span>
        </div>
      </SettingsList>
      <SettingsList dataL10nId='pluginSettings'>
        <SettingCheckbox checked={this.props.flashInstalled ? this.props.braveryDefaults.get('flash') : false} dataL10nId='enableFlash' onChange={this.onToggleFlash} disabled={!this.props.flashInstalled} />
      </SettingsList>
      <div className='subtext'>
        <span className='fa fa-info-circle' id='flashInfoIcon' />
        {
          isDarwin || isWindows
            ? <span><span data-l10n-id='enableFlashSubtext' />
              <span className='linkText'onClick={aboutActions.newFrame.bind(null, {
                location: 'https://get.adobe.com/flashplayer'
              })}>{'Adobe'}</span>.</span>
            : <span data-l10n-id='enableFlashSubtextLinux' />
        }
      </div>
    </div>
  }
}

class AdvancedTab extends ImmutableComponent {
  render () {
    const defaultZoomSetting = getSetting(settings.DEFAULT_ZOOM_LEVEL, this.props.settings)
    return <div>
      <div className='settingsListTitle' data-l10n-id='contentRenderingOptions' />
      <SettingsList>
        <SettingItem dataL10nId='defaultZoomLevel'>
          <select
            value={defaultZoomSetting === undefined || defaultZoomSetting === null ? config.zoom.defaultValue : defaultZoomSetting}
            data-type='float'
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.DEFAULT_ZOOM_LEVEL)}>
            {
              config.zoom.zoomLevels.map((x) =>
                <option value={x} key={x}>{getZoomValuePercentage(x) + '%'}</option>)
            }
          </select>
        </SettingItem>
        <SettingCheckbox dataL10nId='useHardwareAcceleration' prefKey={settings.HARDWARE_ACCELERATION_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
    </div>
  }
}

class HelpfulHints extends ImmutableComponent {
  render () {
    return <div className='helpfulHints'>
      <span className='hintsTitleContainer'>
        <span data-l10n-id='hintsTitle' />
        <span className='hintsRefresh fa fa-refresh'
          onClick={this.props.refreshHint} />
      </span>
      <div data-l10n-id={`hint${this.props.hintNumber}`} />
      <div className='helpfulHintsBottom'>
        <a data-l10n-id='sendUsFeedback' href={appConfig.contactUrl} />
      </div>
    </div>
  }
}

class PreferenceNavigationButton extends ImmutableComponent {
  render () {
    return <div className={cx({
      selected: this.props.selected,
      [this.props.className]: !!this.props.className
    })}>
      <div onClick={this.props.onClick}
        className={cx({
          topBarButton: true,
          fa: true,
          [this.props.icon]: true
        })}>
        <i className={this.props.icon.replace('fa-', 'i-')} />
        <div className='tabMarkerText'
          data-l10n-id={this.props.dataL10nId} />
      </div>
      {
        this.props.selected
        ? <div className='tabMarkerContainer'>
          <div className='tabMarker' />
        </div>
        : null
      }
    </div>
  }
}

class PreferenceNavigation extends ImmutableComponent {
  render () {
    return <div className='prefAside'>
      <div data-l10n-id='prefAsideTitle' />
      <PreferenceNavigationButton icon='fa-list-alt'
        dataL10nId='general'
        onClick={this.props.changeTab.bind(null, preferenceTabs.GENERAL)}
        selected={this.props.preferenceTab === preferenceTabs.GENERAL}
      />
      <PreferenceNavigationButton icon='fa-search'
        dataL10nId='search'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SEARCH)}
        selected={this.props.preferenceTab === preferenceTabs.SEARCH}
      />
      <PreferenceNavigationButton icon='fa-bookmark-o'
        dataL10nId='tabs'
        onClick={this.props.changeTab.bind(null, preferenceTabs.TABS)}
        selected={this.props.preferenceTab === preferenceTabs.TABS}
      />
      <PreferenceNavigationButton icon='fa-lock'
        dataL10nId='security'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SECURITY)}
        selected={this.props.preferenceTab === preferenceTabs.SECURITY}
      />
      <PreferenceNavigationButton icon='fa-user'
        dataL10nId='shields'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SHIELDS)}
        selected={this.props.preferenceTab === preferenceTabs.SHIELDS}
      />
      <PreferenceNavigationButton icon='fa-refresh'
        dataL10nId='sync'
        className='notImplemented'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SYNC)}
        selected={this.props.preferenceTab === preferenceTabs.SYNC}
      />
      <PreferenceNavigationButton icon='fa-server'
        dataL10nId='advanced'
        onClick={this.props.changeTab.bind(null, preferenceTabs.ADVANCED)}
        selected={this.props.preferenceTab === preferenceTabs.ADVANCED}
      />
      <HelpfulHints hintNumber={this.props.hintNumber} refreshHint={this.props.refreshHint} />
    </div>
  }
}

class SitePermissionsPage extends React.Component {
  hasEntryForPermission (name) {
    return this.props.siteSettings.some((value) => {
      return value.get ? typeof value.get(name) === 'boolean' : false
    })
  }
  isPermissionsNonEmpty () {
    // Check whether there is at least one permission set
    return this.props.siteSettings.some((value) => {
      if (value && value.get) {
        for (let i = 0; i < permissionNames.length; i++) {
          if (typeof value.get(permissionNames[i]) === 'boolean') {
            return true
          }
        }
      }
      return false
    })
  }
  deletePermission (name, hostPattern) {
    aboutActions.changeSiteSetting(hostPattern, name, null)
  }
  render () {
    return this.isPermissionsNonEmpty()
    ? <div>
      <div data-l10n-id='sitePermissions'></div>
      <ul className='sitePermissions'>
        {
          permissionNames.map((name) =>
            this.hasEntryForPermission(name)
            ? <li>
              <div data-l10n-id={name} className='permissionName'></div>
              <ul>
              {
                this.props.siteSettings.map((value, hostPattern) => {
                  if (!value.size) {
                    return null
                  }
                  const granted = value.get(name)
                  if (typeof granted === 'boolean') {
                    return <div className='permissionItem'>
                      <span className='fa fa-times permissionAction'
                        onClick={this.deletePermission.bind(this, name, hostPattern)}></span>
                      <span className='permissionHost'>{hostPattern + ': '}</span>
                      <span className='permissionStatus' data-l10n-id={granted ? 'alwaysAllow' : 'alwaysDeny'}></span>
                    </div>
                  }
                  return null
                })
              }
              </ul>
            </li>
            : null)
        }
      </ul>
    </div>
    : null
  }
}

class AboutPreferences extends React.Component {
  constructor () {
    super()
    let hash = window.location.hash ? window.location.hash.slice(1) : ''
    this.state = {
      preferenceTab: hash.toUpperCase() in preferenceTabs ? hash : preferenceTabs.GENERAL,
      hintNumber: this.getNextHintNumber(),
      languageCodes: window.languageCodes ? Immutable.fromJS(window.languageCodes) : Immutable.Map(),
      flashInstalled: false,
      settings: window.initSettings ? Immutable.fromJS(window.initSettings) : Immutable.Map(),
      siteSettings: window.initSiteSettings ? Immutable.fromJS(window.initSiteSettings) : Immutable.Map(),
      braveryDefaults: window.initBraveryDefaults ? Immutable.fromJS(window.initBraveryDefaults) : Immutable.Map()
    }
    aboutActions.checkFlashInstalled()
    window.addEventListener(messages.SETTINGS_UPDATED, (e) => {
      this.setState({
        settings: Immutable.fromJS(e.detail || {})
      })
    })
    window.addEventListener(messages.SITE_SETTINGS_UPDATED, (e) => {
      this.setState({
        siteSettings: Immutable.fromJS(e.detail || {})
      })
    })
    window.addEventListener(messages.BRAVERY_DEFAULTS_UPDATED, (e) => {
      this.setState({
        braveryDefaults: Immutable.fromJS(e.detail || {})
      })
    })
    window.addEventListener(messages.FLASH_UPDATED, (e) => {
      this.setState({
        flashInstalled: e.detail
      })
    })
    this.onChangeSetting = this.onChangeSetting.bind(this)
  }
  changeTab (preferenceTab) {
    this.setState({
      preferenceTab
    })
  }
  refreshHint () {
    this.setState({
      hintNumber: this.getNextHintNumber()
    })
  }
  getNextHintNumber () {
    // Try for a new random number at most 10 times.
    // Avoiding the same tip twice is good because people may think the
    // refresh button is broken.
    let newNumber
    for (let i = 0; i < 10; ++i) {
      newNumber = Math.random() * hintCount | 0
      if (!this.state || newNumber !== this.state.hintNumber) {
        break
      }
    }
    return newNumber
  }
  onChangeSetting (key, value) {
    this.setState({
      settings: this.state.settings.set(key, value)
    })
    aboutActions.changeSetting(key, value)
  }
  render () {
    let tab
    const settings = this.state.settings
    const siteSettings = this.state.siteSettings
    const braveryDefaults = this.state.braveryDefaults
    const languageCodes = this.state.languageCodes
    switch (this.state.preferenceTab) {
      case preferenceTabs.GENERAL:
        tab = <GeneralTab settings={settings} onChangeSetting={this.onChangeSetting} languageCodes={languageCodes} />
        break
      case preferenceTabs.SEARCH:
        tab = <SearchTab settings={settings} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.TABS:
        tab = <TabsTab settings={settings} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.SECURITY:
        tab = <SecurityTab settings={settings} braveryDefaults={braveryDefaults} flashInstalled={this.state.flashInstalled} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.SHIELDS:
        tab = <ShieldsTab settings={settings} siteSettings={siteSettings} braveryDefaults={braveryDefaults} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.SYNC:
        tab = <SyncTab settings={settings} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.ADVANCED:
        tab = <AdvancedTab settings={settings} onChangeSetting={this.onChangeSetting} />
        break
    }
    return <div>
      <PreferenceNavigation preferenceTab={this.state.preferenceTab} hintNumber={this.state.hintNumber}
        changeTab={this.changeTab.bind(this)}
        refreshHint={this.refreshHint.bind(this)}
        getNextHintNumber={this.getNextHintNumber.bind(this)} />
      <div className='prefBody'>
        <div className='prefTabContainer'>
          {tab}
        </div>
      </div>
    </div>
  }
}

module.exports = <AboutPreferences />
