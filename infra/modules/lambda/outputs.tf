output "arn" {
  value = aws_lambda_function.function.arn
}

output "ID" {
  value = aws_lambda_function.function.id
}

output "name" {
  value = aws_lambda_function.function.function_name
}

output "invoke_arn" {
  value = aws_lambda_function.function.invoke_arn
}

output "role_name" {
  value = aws_iam_role.execution_role.name
}

output "role_arn" {
  value = aws_iam_role.execution_role.arn
}

output "version" {
  value = aws_lambda_function.function.version
}

output "qualified_arn" {
  value = aws_lambda_function.function.qualified_arn
}

output "qualified_invoke_arn" {
  value = aws_lambda_function.function.qualified_invoke_arn
}
