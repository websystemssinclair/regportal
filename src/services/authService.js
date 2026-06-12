import axios from 'axios'

const authClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
})

export const getApiToken = () =>
  authClient.post('authenticate', {
    username: import.meta.env.VITE_API_USER,
    password: import.meta.env.VITE_API_PASS,
  })

export const retrieveUserFromSaml = (samlId) =>
  authClient.get(`saml/RetrieveSSOUser/${samlId}?dsn=${import.meta.env.VITE_DSN}`)

export const sendSamlRequest = () =>
  authClient.post('saml/SendRequest', {
    appName: import.meta.env.VITE_APP_NAME,
    targetUrl: import.meta.env.VITE_TARGET_URL,
  })

export const getUserData = (payload) => authClient.post('UserData', payload)
