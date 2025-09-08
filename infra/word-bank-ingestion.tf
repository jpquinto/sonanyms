module "word_bank_ingestion_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "word-bank-ingestion-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/word-bank-ingestion"
  build_path      = "${path.root}/../lambda_functions/build/word-bank-ingestion/word-bank-ingestion.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  layers = [
    module.shared_lambda_layer.layer_arn,
  ]

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
  }
}
