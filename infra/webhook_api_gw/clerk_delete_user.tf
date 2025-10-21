module "clerk_delete_user_lambda" {
  source  = "../modules/lambda"
  context = var.context

  name            = "clerk-delete-user-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../lambda_functions/dist/webhook_api_gw/clerk_delete_user"
  build_path      = "${path.root}/../lambda_functions/build/webhook_api_gw/clerk_delete_user/clerk_delete_user.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  create_sg                   = false
  enable_vpc_access           = false
  ipv6_allowed_for_dual_stack = false

  layers = [
    var.shared_layer_arn
  ]

  environment_variables = {
    USERS_TABLE_NAME : var.users_table_name
    CLERK_WEBHOOK_SECRET : var.clerk_delete_user_webhook_secret
  }
}

resource "aws_iam_policy" "delete_user_policy" {
  name        = "delete-user-policy"
  description = "Policy for delete user lambda."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = [
            var.users_table_arn
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "delete_user_attach" {
  role       = module.clerk_delete_user_lambda.role_name
  policy_arn = aws_iam_policy.delete_user_policy.arn
}

