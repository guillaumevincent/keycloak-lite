const axios = require("axios");
const uuidv4 = require("uuid/v4");

class Keycloack {
  constructor(options = {}) {
    const { url, realm, clientId } = options;
    this.url = url;
    this.realm = realm;
    this.clientId = clientId;
    this.token = null;
  }

  _get_current_uri() {
    return window.location.href.split("#")[0];
  }

  login(options = {}) {
    const redirectUri = options.redirectUri || this._get_current_uri();
    const params = {
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state: uuidv4(),
      response_mode: "fragment",
      response_type: "code",
      scope: "openid",
      nonce: uuidv4()
    };
    const encodedParams = Object.keys(params).reduce((acc, key) => {
      acc.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      return acc;
    }, []);
    window.location.replace(
      `${this.url}/auth/realms/${
        this.realm
      }/protocol/openid-connect/auth?${encodedParams.join("&")}`
    );
  }

  init() {
    const urlParams = new URLSearchParams(window.location.hash);
    const code = urlParams.get("code");
    if (code) {
      const data = new URLSearchParams();
      data.append("code", code);
      data.append("grant_type", "authorization_code");
      data.append("client_id", this.clientId);
      data.append("redirect_uri", this._get_current_uri());
      return axios
        .post(
          `${this.url}/auth/realms/${this.realm}/protocol/openid-connect/token`,
          data,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            }
          }
        )
        .then(response => {
          this.token = response.data.access_token;
          return Promise.resolve(true);
        })
        .catch(error => {
          return Promise.resolve(false);
        });
    }
    return Promise.resolve(false);
  }
}

module.exports = Keycloack;
