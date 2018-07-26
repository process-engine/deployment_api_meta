# Deployment API Integration Tests

This folder contains integration tests for the process engine DeploymentAPI

## What are the goals of this project?

The goal of this is to make sure that the DeploymentAPI is behaving as described
in the concept document it is based on.

## Relevant URLs

- https://github.com/process-engine/deployment_api_contracts
- https://github.com/process-engine/deployment_api_core
- https://github.com/process-engine/deployment_api_http

## How do I set this project up?

### Prerequesites

- Node `>= 8.9.x` + npm `>= 5.6.0`
- Docker `>= 17.05.0`

### Setup/Installation

1. Make sure you have a PostgresDB running.
   For a dockerized and ready-to-go database setup, see the
   [skeleton database](https://github.com/process-engine/skeleton/tree/develop/database)
   of the process engine.
2. Configure your local repositories to access your database.
   You can find the relevant config files here:
   - [`config/test/process/engine/flow_node_instance_repository.json`]
   - [`config/test/process/engine/process_model_repository.json`]
   - [`config/test/process/engine/timer_repository.json`]
3. run `npm install` to install the dependencies of the integration tests,
   including the deployment_api packages that will be tested.

4. run `npm run build` to ensure all typescript files are transpiled.

### Seeding

No seeding is required.

## How do I use this project?

### Usage

Run `npm test` in this folder.

## What else is there to know?

### Authors/Contact information

- Christian Werner
