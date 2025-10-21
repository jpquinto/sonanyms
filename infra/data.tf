data "aws_secretsmanager_secret_version" "sonanyms_api_secrets" {
  secret_id = "Sonanyms-API-Key"
}

locals {
  sonanyms_secrets = jsondecode(data.aws_secretsmanager_secret_version.sonanyms_api_secrets.secret_string)
}

data "aws_secretsmanager_secret_version" "sonanyms_clerk_api_secrets" {
  secret_id = "Sonanyms-Clerk-Secrets"
}

locals {
  clerk_secrets = jsondecode(data.aws_secretsmanager_secret_version.sonanyms_clerk_api_secrets.secret_string)
}