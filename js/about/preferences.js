/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const Immutable = require('immutable')
const cx = require('../lib/classSet.js')
const appConfig = require('../constants/appConfig')
const preferenceTabs = require('../constants/preferenceTabs')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const aboutActions = require('./aboutActions')
const getSetting = require('../settings').getSetting
const tableSort = require('tablesort')
const pad = require('underscore.string/pad')
const classnames = require('classnames')

const adblock = appConfig.resourceNames.ADBLOCK
const cookieblock = appConfig.resourceNames.COOKIEBLOCK
const adInsertion = appConfig.resourceNames.AD_INSERTION
const trackingProtection = appConfig.resourceNames.TRACKING_PROTECTION
const httpsEverywhere = appConfig.resourceNames.HTTPS_EVERYWHERE
const safeBrowsing = appConfig.resourceNames.SAFE_BROWSING
const noScript = appConfig.resourceNames.NOSCRIPT

const isDarwin = navigator.platform === 'MacIntel'

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
        ? <div className='settingsListTitle' data-l10n-id={this.props.dataL10nId} />
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
      <span className='checkboxContainer'>
        <input type='checkbox' id={this.props.prefKey}
          disabled={this.props.disabled}
          onChange={this.props.onChange ? this.props.onChange : changeSetting.bind(null, this.props.onChangeSetting, this.props.prefKey)}
          checked={this.props.checked !== undefined ? this.props.checked : getSetting(this.props.prefKey, this.props.settings)} />
      </span>
      <label data-l10n-id={this.props.dataL10nId} htmlFor={this.props.prefKey} />
    </div>
  }
}

class ModalOverlay extends ImmutableComponent {
  render () {
    return <div className={classnames('modal fade', { hidden: !this.props.shouldShow })} role='alert'>
      <div className='dialog'>
        <button type='button' className='close pull-right' onClick={this.props.onHide}>
          <span>&times;</span>
        </button>
        <div className='settingsListTitle'>{this.props.title}</div>
        <div>{this.props.content}</div>
        <button type='button' className='pull-right' onClick={this.props.onHide}>Done</button>
      </div>
    </div>
  }
}

class LedgerTableRow extends ImmutableComponent {
  getFormattedTime () {
    var d = this.props.daysSpent
    var h = this.props.hoursSpent
    var m = this.props.minutesSpent
    var s = this.props.secondsSpent
    if (d << 0 > 364) {
      return '>1y'
    }
    d = (d << 0 === 0) ? '' : (d + 'd ')
    h = (h << 0 === 0) ? '' : (h + 'h ')
    m = (m << 0 === 0) ? '' : (m + 'm ')
    s = (s << 0 === 0) ? '' : (s + 's ')
    return (d + h + m + s + '')
  }
  padLeft (v) { return pad(v, 12, '0') }
  render () {
    var favicon = this.props.faviconURL ? <img src={this.props.faviconURL} alt={this.props.site} /> : null
    return <tr>
      <td data-sort={this.padLeft(this.props.rank)}>{this.props.rank}</td>
      <td><a href={this.props.publisherURL}>{favicon}<span>{this.props.site}</span></a></td>
      <td data-sort={this.padLeft(this.props.views)}>{this.props.views}</td>
      <td data-sort={this.padLeft(this.props.duration)}>{this.getFormattedTime()}</td>
      <td className='notImplemented'><input type='range' name='points' min='0' max='10'></input></td>
      <td data-sort={this.padLeft(this.props.percentage)}>{this.props.percentage}</td>
    </tr>
  }
}

class LedgerTable extends ImmutableComponent {
  componentDidMount (event) {
    return tableSort(document.getElementById('ledgerTable')).refresh()
  }
  render () {
    var rows = []
    for (let i = 0; i < this.props.data.length; i++) {
      rows[i] = <LedgerTableRow {...this.props.data[i]} />
    }
    return <table id='ledgerTable' className='sort'>
      <thead>
        <tr>
          <th className='sort-header' data-l10n-id='rank' />
          <th className='sort-header' data-l10n-id='publisher' />
          <th className='sort-header' data-l10n-id='views' />
          <th className='sort-header' data-l10n-id='timeSpent' />
          <th className='sort-header notImplemented' data-l10n-id='adjustment' />
          <th className='sort-header'>&#37;</th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  }
}

class GeneralTab extends ImmutableComponent {
  render () {
    var languageOptions = this.props.languageCodes.map(function (lc) {
      return (
        <option data-l10n-id={lc} value={lc} />
      )
    })
    const defaultLanguage = this.props.languageCodes.find((lang) => lang.includes(navigator.language)) || 'en-US'
    return <SettingsList>
      <SettingsList>
        <SettingItem dataL10nId='selectedLanguage'>
          <select value={getSetting(settings.LANGUAGE, this.props.settings) || defaultLanguage}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.LANGUAGE)} >
            {languageOptions}
          </select>
        </SettingItem>
        <SettingItem dataL10nId='startsWith'>
          <select value={getSetting(settings.STARTUP_MODE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.STARTUP_MODE)} >
            <option data-l10n-id='startsWithOptionLastTime' value='lastTime' />
            <option data-l10n-id='startsWithOptionHomePage' value='homePage' />
            <option data-l10n-id='startsWithOptionNewTabPage' value='newTabPage' />
          </select>
        </SettingItem>
        <SettingItem dataL10nId='myHomepage'>
          <input data-l10n-id='homepageInput'
            value={getSetting(settings.HOMEPAGE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.HOMEPAGE)} />
        </SettingItem>
      </SettingsList>
      <SettingsList dataL10nId='bookmarkToolbarSettings'>
        <SettingCheckbox dataL10nId='bookmarkToolbar' prefKey={settings.SHOW_BOOKMARKS_TOOLBAR} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='bookmarkToolbarShowFavicon' prefKey={settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='bookmarkToolbarShowOnlyFavicon' style={{ visibility: (getSetting(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON, this.props.settings) === true ? 'visible' : 'hidden') }} prefKey={settings.SHOW_BOOKMARKS_TOOLBAR_ONLY_FAVICON} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
      <SettingsList dataL10nId='appearanceSettings'>
        <SettingCheckbox dataL10nId='showHomeButton' prefKey={settings.SHOW_HOME_BUTTON} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        {
          isDarwin ? null : <SettingCheckbox dataL10nId='autoHideMenuBar' prefKey={settings.AUTO_HIDE_MENU} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        }
        <SettingCheckbox dataL10nId='disableTitleMode' prefKey={settings.DISABLE_TITLE_MODE} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
    </SettingsList>
  }
}

class SearchTab extends ImmutableComponent {
  render () {
    return <div>
      <SettingsList>
        <SettingItem dataL10nId='defaultSearchEngine'>
          <select value={getSetting(settings.DEFAULT_SEARCH_ENGINE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.DEFAULT_SEARCH_ENGINE)}>
            <option value='content/search/google.xml'>Google</option>
            <option value='content/search/duckduckgo.xml'>DuckDuckGo</option>
          </select>
        </SettingItem>
      </SettingsList>
      <SettingsList dataL10nId='suggestionTypes'>
        <SettingCheckbox dataL10nId='history' prefKey={settings.HISTORY_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='bookmarks' prefKey={settings.BOOKMARK_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='openedTabs' prefKey={settings.OPENED_TAB_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
    </div>
  }
}

class TabsTab extends ImmutableComponent {
  render () {
    return <SettingsList>
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
  }
}

class SecurityTab extends ImmutableComponent {
  render () {
    return <div>
      <SettingsList>
        <SettingCheckbox dataL10nId='usePasswordManager' prefKey={settings.PASSWORD_MANAGER_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='useOnePassword' prefKey={settings.ONE_PASSWORD_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='useDashlane' prefKey={settings.DASHLANE_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
      <div>
        <span className='linkText' data-l10n-id='managePasswords'
          onClick={aboutActions.newFrame.bind(null, {
            location: 'about:passwords'
          }, true)}></span>
      </div>
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
      <SettingsList dataL10nId='braveryDefaults'>
        <SettingItem dataL10nId='adControl'>
          <select value={this.props.braveryDefaults.get('adControl')} onChange={this.onChangeAdControl}>
            <option data-l10n-id='showBraveAds' value='showBraveAds' />
            <option data-l10n-id='blockAds' value='blockAds' />
            <option data-l10n-id='allowAdsAndTracking' value='allowAdsAndTracking' />
          </select>
        </SettingItem>
        <SettingItem dataL10nId='cookieControl'>
          <select value={this.props.braveryDefaults.get('cookieControl')} onChange={this.onChangeCookieControl}>
            <option data-l10n-id='block3rdPartyCookie' value='block3rdPartyCookie' />
            <option data-l10n-id='allowAllCookies' value='allowAllCookies' />
          </select>
        </SettingItem>
        <SettingCheckbox checked={this.props.braveryDefaults.get('httpsEverywhere')} dataL10nId='httpsEverywhere' onChange={this.onToggleHTTPSE} />
        <SettingCheckbox checked={this.props.braveryDefaults.get('safeBrowsing')} dataL10nId='safeBrowsing' onChange={this.onToggleSafeBrowsing} />
        <SettingCheckbox checked={this.props.braveryDefaults.get('noScript')} dataL10nId='noScript' onChange={this.onToggleNoScript} />
      </SettingsList>
      <SettingsList dataL10nId='advancedPrivacySettings'>
        <SettingCheckbox dataL10nId='doNotTrack' prefKey={settings.DO_NOT_TRACK} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='blockCanvasFingerprinting' prefKey={settings.BLOCK_CANVAS_FINGERPRINTING} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
      <SitePermissionsPage siteSettings={this.props.siteSettings} />
    </div>
  }
}

class PaymentsTab extends ImmutableComponent {
  shouldComponentUpdate () { return true }
  componentWillMount () {
    this.setState({ shouldShowOverlay: false })
  }
  hideOverlay (event) {
    this.setState({ shouldShowOverlay: false })
  }
  showOverlay (event) {
    this.setState({ shouldShowOverlay: true })
  }
  update (event) {
    console.log('update')
  }
  disconnect (event) {
    console.log('disconnect')
  }
  render () {
    return <div id='paymentsContainer'>
      <ModalOverlay title={'Hello'} content={'World!'} shouldShow={this.state.shouldShowOverlay} onShow={this.showOverlay.bind(this)} onHide={this.hideOverlay.bind(this)} />
      <div className='titleBar'>
        <div className='settingsListTitle pull-left' data-l10n-id='publisherPaymentsTitle' value='publisherPaymentsTitle' />
        <div className='settingsListLink pull-right' data-l10n-id='disconnect' onClick={this.disconnect.bind(this)} />
      </div>
      <div className='notificationBar'>
        <div className='pull-left' data-l10n-id='notificationBarText' />
        <div className='settingsListLink pull-right' data-l10n-id='update' onClick={this.update.bind(this)} />
        <div className='settingsListLink pull-right' data-l10n-id='viewLog' onClick={this.showOverlay.bind(this)} />
      </div>
      <LedgerTable data={this.props.data} />
    </div>
  }
}
PaymentsTab.propTypes = { data: React.PropTypes.array.isRequired }
PaymentsTab.defaultProps = { data: [] }

class SyncTab extends ImmutableComponent {
  render () {
    return <div id='syncContainer'>
      Sync settings coming soon
    </div>
  }
}

class AdvancedTab extends ImmutableComponent {
  render () {
    return <div id='advancedContainer'>
      Advanced settings coming soon
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
      <PreferenceNavigationButton icon='fa-bitcoin'
        dataL10nId='publishers'
        onClick={this.props.changeTab.bind(null, preferenceTabs.PAYMENTS)}
        selected={this.props.preferenceTab === preferenceTabs.PAYMENTS}
      />
      <PreferenceNavigationButton icon='fa-refresh'
        dataL10nId='sync'
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
      settings: window.initSettings ? Immutable.fromJS(window.initSettings) : Immutable.Map(),
      siteSettings: window.initSiteSettings ? Immutable.fromJS(window.initSiteSettings) : Immutable.Map(),
      braveryDefaults: window.initBraveryDefaults ? Immutable.fromJS(window.initBraveryDefaults) : Immutable.Map(),
      ledger: []
    }
    window.addEventListener(messages.SETTINGS_UPDATED, (e) => {
      this.setState({
        settings: Immutable.fromJS(e.detail || {})
      })
    })
    window.addEventListener(messages.LEDGER_UPDATED, (e) => {
      PaymentsTab.defaultProps.data = e.detail.synopsis
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
        tab = <SecurityTab settings={settings} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.SHIELDS:
        tab = <ShieldsTab settings={settings} siteSettings={siteSettings} braveryDefaults={braveryDefaults} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.PAYMENTS:
        tab = <PaymentsTab settings={settings} siteSettings={siteSettings} braveryDefaults={braveryDefaults} onChangeSetting={this.onChangeSetting} />
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
