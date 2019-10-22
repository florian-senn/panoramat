import LogRocket from 'logrocket'
import Vue from 'vue'
import * as Sentry from '@sentry/browser'
import * as Integrations from '@sentry/integrations'

Sentry.init({
  dsn: 'https://43a7e86ef04c47e3b04458a512fede9b@sentry.io/1788754',
  integrations: [new Integrations.Vue({ Vue, attachProps: true })]
})

LogRocket.init('hz3i5c/panoramat')

LogRocket.getSessionURL(sessionURL => {
  Sentry.configureScope(scope => {
    scope.setExtra('sessionURL', sessionURL)
  })
})
