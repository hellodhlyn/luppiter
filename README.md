[![Travis CI](https://img.shields.io/travis/lynlab/luppiter.svg?style=flat-square)](https://travis-ci.org/lynlab/luppiter)
[![Codecov](https://img.shields.io/codecov/c/gh/lynlab/luppiter.svg?style=flat-square)](https://codecov.io/gh/lynlab/luppiter)

# LYnLab Luppiter

> Restful APIs for LYnLab Luppiter services.  
> For further information, see documentations on [LYnLab Luppiter console](https://luppiter.lynlab.co.kr/web).

## Development

### Prerequisited

- nodejs
- yarn (recommended)
- docker-compose

### Start Database

```sh
# Start database
(cd ./compose/local; docker-compose up -d)

# Set environments
cp .env.example .env
vi .env  # set your own configurations

# Run migration
yarn
yarn typeorm run:migration
```

### Run Server

```sh
yarn start
```
