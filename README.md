# Delegated FS - Using DappyKit via Farcaster

DappyKit application authorization without leaving Farcaster is necessary to provide Farcaster users with DappyKit capabilities and technologies.

Authorized DappyKit applications in the form of Frames gain access to the user's decentralized public data space. This opens up new possibilities for creating innovative applications.

Such applications can exist both within the Farcaster ecosystem and as independent, standalone applications both on the web and mobile.

**Flow:**
- The application creator registers the URL of their Frame in the system using the `/v1/app/create` endpoint.
- A user of a third-party application can give access to read/write their DappyKit data through the DappyKit Auth Frame while using this application.
- When granting access to data, the third-party application must register an authorization request in the system. The request must include the public address of the key created for this user, which will be used to manage the user's data.
- The authorization request is sent from the third-party application to DappyKit through the `/v2/authorization/create`.
- During the registration of the application, it is cryptographically verified that the application was initiated by a specific user.
- During the registration, three random numbers in the range of 1-100 are generated. One of the options is the correct answer. The answer is transmitted to the application that made the request.
- The third-party application displays a prompt for the person to authorize it in the DappyKit Auth Frame. For this, it displays the correct answer and asks to indicate it in the trusted Frame.
- After the third-party application is authorized, DappyKit Auth approves the generated key for the user and marks it as trusted by signing its public address.
- After completing the flow, the third-party application can manage data in the isolated data space of the user.
- After the key is revoked, the data in this space can also be cleared.

## App Registration

To register your application for interaction with DappyKit within Farcaster, you need to do the following:
- Create a Frame and insert the tag `<meta property="frame:owner" content="FID"/>`, where FID is the unique number of your account in Farcaster from which you will be registering the application.
- Create a Callback URL that will receive events about user authentication events.
- Create an ETH private key that will sign actions of your application.
- Go to Frame DappyKit Auth and enter the public address of your ETH signer, Frame URL, and Callback service URL.
- Done! After this, you can request access to the user's isolated data area, which is available only to the user and your application.

Explore the examples of using DappyKit Auth to start rapid development.

## Custom Auth Service Deployment

### Testnet

```shell
# install dependencies
npm ci

# copy and fill the env
cp example.env .env

# create DB
mysql -u root -p < ./migrations/testnet_db.sql

# start interactive mode for MySQL user creation:
mysql -u root

# and run commands
CREATE USER 'testnet_farcaster_auth'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON testnet_farcaster_auth.* TO 'testnet_farcaster_auth'@'localhost';
FLUSH PRIVILEGES;

exit;

# apply migrations
npx knex migrate:latest --env development

# start deployer service via PM2
pm2 start npm --name "[Testnet] Farcaster Auth API" -- run start

# OR start the server manually
npm run start
```

### Create migration

```shell
# create new migration
npx knex migrate:make my_new_migration
```

### Mainnet

```shell
# install dependencies
npm ci

# copy and fill the env
cp example.env .env

# create DB
mysql -u root -p < ./migrations/mainnet_db.sql

# start interactive mode for MySQL user creation:
mysql -u root -p

# and run commands
CREATE USER 'mainnet_farcaster_auth'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON mainnet_farcaster_auth.* TO 'mainnet_farcaster_auth'@'localhost';
FLUSH PRIVILEGES;

exit;

# apply migrations
npx knex migrate:latest --env production

# start deployer service via PM2
pm2 start npm --name "[Mainnet] Farcaster Auth API" -- run start

# OR start the server manually
npm run start
```
