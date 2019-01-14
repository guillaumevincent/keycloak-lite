const Keycloak = require("./index");
const nock = require("nock");
const jsdom = require("jsdom");

test("Keycloak can be instanciated", () => {
  const keycloak = new Keycloak();
  expect(keycloak).toBeDefined();
});

test("Keycloak save url realm and clientId from constructor", () => {
  const keycloak = new Keycloak({
    url: "http://localhost:8180",
    realm: "test-realm",
    clientId: "test-clientId"
  });
  expect(keycloak.url).toBe("http://localhost:8180");
  expect(keycloak.realm).toBe("test-realm");
  expect(keycloak.clientId).toBe("test-clientId");
});

test("Keycloak login", () => {
  global.window = new jsdom.JSDOM("", {
    url: "http://localhost:8000/login"
  }).window;

  global.window.location.replace = jest.fn();

  const keycloak = new Keycloak({
    url: "http://localhost:8180",
    realm: "master",
    clientId: "test"
  });

  keycloak.login({ redirectUri: "http://example.org/login" });

  const location = window.location.replace.mock.calls[0][0];
  const splitedUrl = location.split("&");

  expect(splitedUrl[0]).toBe(
    "http://localhost:8180/auth/realms/master/protocol/openid-connect/auth?client_id=test"
  );
  expect(splitedUrl[1]).toBe("redirect_uri=http%3A%2F%2Fexample.org%2Flogin");
  expect(
    /state=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(
      splitedUrl[2]
    )
  ).toBe(true);
  expect(splitedUrl[3]).toBe("response_mode=fragment");
  expect(splitedUrl[4]).toBe("response_type=code");
  expect(splitedUrl[5]).toBe("scope=openid");
  expect(
    /nonce=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(
      splitedUrl[6]
    )
  ).toBe(true);
});

test("Keycloak login use current url if no redirectUri", () => {
  global.window = new jsdom.JSDOM("", {
    url: "http://current.example.org/login"
  }).window;

  global.window.location.replace = jest.fn();

  const keycloak = new Keycloak({
    url: "http://localhost:8180",
    realm: "master",
    clientId: "test"
  });

  keycloak.login();

  const location = window.location.replace.mock.calls[0][0];
  expect(location.split("&")[1]).toBe(
    "redirect_uri=http%3A%2F%2Fcurrent.example.org%2Flogin"
  );
});

test("Keycloak get token from url", () => {
  global.window = new jsdom.JSDOM("", {
    url:
      "http://example.org/login#state=4878945f-b978-4521-8455-389300e57ee6&session_state=d73b0903-bb56-4c43-82e6-8ed6d1c0459b&code=code"
  }).window;

  const initRequest = nock("http://localhost:8180", {
    reqheaders: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })
    .post("/auth/realms/test-realm/protocol/openid-connect/token", {
      code: "code",
      grant_type: "authorization_code",
      client_id: "test",
      redirect_uri: "http://example.org/login"
    })
    .reply(200, {
      access_token: "jwt",
      expires_in: 300,
      refresh_expires_in: 1800,
      refresh_token: "rjwt",
      token_type: "bearer",
      id_token: "idjwt",
      "not-before-policy": 0,
      session_state: "d73b0903-bb56-4c43-82e6-8ed6d1c0459b",
      scope: "openid email profile"
    });

  const keycloak = new Keycloak({
    url: "http://localhost:8180",
    realm: "test-realm",
    clientId: "test"
  });

  return keycloak.init().then(authenticated => {
    expect(initRequest.isDone()).toBe(true);
    expect(authenticated).toBe(true);
    expect(keycloak.token).toBe("jwt");
  });
});

test("Keycloak get token from url no code", () => {
  global.window = new jsdom.JSDOM("", {
    url: "http://example.org/login"
  }).window;

  const keycloak = new Keycloak({
    url: "http://localhost:8180",
    realm: "test-realm",
    clientId: "test"
  });

  return keycloak.init().then(authenticated => {
    expect(authenticated).toBe(false);
    expect(keycloak.token).toBe(null);
  });
});

test("Keycloak get token from url error 500", () => {
  global.window = new jsdom.JSDOM("", {
    url:
      "http://example.org/login#state=4878945f-b978-4521-8455-389300e57ee6&session_state=d73b0903-bb56-4c43-82e6-8ed6d1c0459b&code=code"
  }).window;

  const initRequest = nock("http://localhost:8180")
    .post("/auth/realms/test-realm/protocol/openid-connect/token", {
      code: "code",
      grant_type: "authorization_code",
      client_id: "test",
      redirect_uri: "http://example.org/login"
    })
    .reply(500);

  const keycloak = new Keycloak({
    url: "http://localhost:8180",
    realm: "test-realm",
    clientId: "test"
  });

  return keycloak.init().then(authenticated => {
    expect(initRequest.isDone()).toBe(true);
    expect(authenticated).toBe(false);
    expect(keycloak.token).toBe(null);
  });
});
