module "submit_word_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "submit-word-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/websocket_api_gw/submit_word"
  build_path      = "${path.root}/../lambda_functions/build/websocket_api_gw/submit_word/submit_word.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  layers = []

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
  }
}


resource "aws_iam_policy" "submit_word_policy" {
  name        = "submit-word-policy"
  description = "Policy for submit word lambda."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "execute-api:*"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "submit_word_attach" {
  role       = module.submit_word_lambda.role_name
  policy_arn = aws_iam_policy.submit_word_policy.arn
}
