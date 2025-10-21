module "shared_lambda_layer" {
  source = "./modules/lambda_layer"

  context     = module.null_label.context
  name        = "shared-layer"
  description = "Shared utilities and dependencies for all lambdas"

  runtime         = ["nodejs20.x"]
  architecture    = ["x86_64", "arm64"]
  deployment_type = "zip"
  zip_project     = false

  filename = "${path.root}/../lambda_functions/build/layers/shared_layer.zip"

  upload_to_s3 = false
}

module "websocket_lambda_layer" {
  source = "./modules/lambda_layer"

  context     = module.null_label.context
  name        = "sonanyms-websocket-layer"
  description = "Shared utilities and dependencies for websocket lambdas"

  runtime         = ["nodejs20.x"]
  architecture    = ["x86_64", "arm64"]
  deployment_type = "zip"
  zip_project     = false

  filename = "${path.root}/../lambda_functions/build/layers/websocket_api_layer.zip"

  upload_to_s3 = false
}