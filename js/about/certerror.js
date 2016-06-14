/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Button = require('../components/button')
const aboutActions = require('./aboutActions')
const WindowConstants = require('../constants/windowConstants')

require('../../less/button.less')
require('../../less/window.less')
require('../../less/about/error.less')

class CertErrorPage extends React.Component {
  constructor () {
    super()
    this.state = {
      advanced: false
    }
  }

  onAccept () {
    aboutActions.acceptCertError(this.state.url)
    aboutActions.dispatchAction({
      actionType: WindowConstants.WINDOW_SET_URL,
      location: this.state.url,
      key: this.state.frameKey
    })
  }

  onSafety () {
    aboutActions.dispatchAction({
      actionType: WindowConstants.WINDOW_SET_URL,
      location: this.state.previousLocation,
      key: this.state.frameKey
    })
  }

  onAdvanced () {
    this.setState({advanced: true})
  }

  render () {
    return <div className='errorContent'>
      <svg width='75' height='75' className='errorLogo' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
        <path className='errorLogoInner' d='M80.459 45.474h-1.926V29.826C78.435 10.633 65.344.183 49.433.183c-15.906 0-30.168 10.945-29.672 29.643l-.016 15.628s.24.021-.961.021c-1.27 0-9.639 1.471-9.639 8.932v35.821c0 7.959 9.42 9.943 9.639 9.943h61.2c.219 0 9.154-.993 9.154-9.943V54.901c.001-8.449-8.454-9.427-8.679-9.427zM33.234 30.033c0-9.949 6.07-17.902 15.906-17.902 9.741 0 15.905 6.957 15.905 17.902l.01 15.441H33.218l.016-15.441zm26.1693767 60.84L48.4582822 79.9279055 38.2296592 90.364449 31.6365 83.7568885l10.9459946-10.9414942-10.238524-10.221422 6.4104412-6.4860487 10.9468947 10.9423942 10.4221422-10.340234L66.6365 63.224035 55.6896053 74.1673295l10.319532 10.310531L59.4033767 90.873z' fill='#000' fill-rule='evenodd' />
      </svg>
      <div className='certErrorText'>
        <span data-l10n-id='certErrorText'></span>&nbsp;
        <span className='errorUrl'>{this.state.url || ''}</span>
        <span className='errorText'>{this.state.error || ''}</span>
      </div>
      <div className='buttons'>
        <Button l10nId='certErrorSafety' className='actionButton' onClick={this.onSafety.bind(this)} />
        {this.state.url ? (this.state.advanced
                  ? <Button l10nId='certErrorButtonText' className='subtleButton' onClick={this.onAccept.bind(this)} />
                  : <Button l10nId='certErrorAdvanced' className='subtleButton' onClick={this.onAdvanced.bind(this)} />) : null}
      </div>
    </div>
  }
}

module.exports = <CertErrorPage />
