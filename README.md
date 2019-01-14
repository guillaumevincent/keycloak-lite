# keycloak lite

javascript adpater for modern browser

## install

    yarn install

## test

    yarn test


## build

    yarn build


## notes

start keycloak backend container

    docker run -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin -p 8080:8080 jboss/keycloak

create 'test' realm and 'test' clientId