# DappyKit Authorization for Farcaster



Testnet

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
pm2 start npm --name "[Testnet] Farcaster Auth" -- run start

# OR start the server manually
npm run start
```

### Create migration

```shell
# create new migration
npx knex migrate:make my_new_migration
```

Mainnet

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
pm2 start npm --name "[Mainnet] Farcaster Auth" -- run start

# OR start the server manually
npm run start
```
