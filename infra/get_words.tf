
module "get_words_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "get-words-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/base_api_gw/get_words"
  build_path      = "${path.root}/../lambda_functions/build/base_api_gw/get_words/get_words.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  create_sg                   = false
  enable_vpc_access           = false
  ipv6_allowed_for_dual_stack = false

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    ID_STATUS_TABLE_NAME : module.id_status_table.name
    WORD_BANK_TABLE_NAME : module.word_bank_table.name
  }
}

resource "aws_iam_policy" "get_words_policy" {
  name        = "get-words-policy"
  description = "Policy for get words lambda."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = [
            module.word_bank_table.arn,
            module.id_status_table.arn,
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "get_words_attach" {
  role       = module.get_words_lambda.role_name
  policy_arn = aws_iam_policy.get_words_policy.arn
}


