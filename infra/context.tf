module "null_label" {
  source = "cloudposse/label/null"

  namespace   = var.project_namespace
  environment = var.environment
  stage       = var.stage

  delimiter           = "-"
  regex_replace_chars = "/[^a-zA-Z0-9-_]/"

  label_order = ["environment", "name"]

  tags = {
    "Project"   = var.project_name
    "Developer" = var.developer
    "Owner"     = var.owner
  }
}
