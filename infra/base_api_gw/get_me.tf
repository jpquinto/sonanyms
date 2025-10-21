
module "get_me_lambda" {
  source  = "../modules/lambda"
  context = var.context

  name            = "get-me-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/base_api_gw/get_me"
  build_path      = "${path.root}/../lambda_functions/build/base_api_gw/get_me/get_me.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  create_sg                   = false
  enable_vpc_access           = false
  ipv6_allowed_for_dual_stack = false

  environment_variables = {
    USERS_TABLE_NAME : var.users_table_name
  }
}

resource "aws_iam_policy" "get_me_policy" {
  name        = "get-me-policy"
  description = "Policy for get me lambda."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = [
          var.users_table_arn,
          "${var.users_table_arn}/index/*"
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "get_me_attach" {
  role       = module.get_me_lambda.role_name
  policy_arn = aws_iam_policy.get_me_policy.arn
}


