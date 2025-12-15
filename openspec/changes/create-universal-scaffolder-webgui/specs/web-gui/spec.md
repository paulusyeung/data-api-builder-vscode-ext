# Capability: Web GUI Scaffolder

## ADDED Requirements

#### Scenario: User opens Universal Scaffolder
- Given I am a user in VS Code
- When I run the command "DAB: Universal Scaffolder"
- Then a Webview should open with a "Connect to Database" form

#### Scenario: User connects to PostgreSQL
- Given I am on the "Connect to Database" form
- When I select "PostgreSQL" and enter a valid connection string
- Then the "Entity Selection" screen should appear with a list of tables

#### Scenario: User generates configuration
- Given I have selected tables "Users" and "Books"
- When I click "Generate Config"
- Then a `dab-config.json` file should be created in the workspace root
- AND it should contain definitions for "Users" and "Books"
