output "layer_arn" {
  value = aws_lambda_layer_version.version.arn
}

output "layer_name" {
  value = aws_lambda_layer_version.version.layer_name
}
