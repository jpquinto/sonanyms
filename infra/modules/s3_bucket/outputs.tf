output "bucket_name" {
  value = aws_s3_bucket.s3.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.s3.arn
}

output "bucket_domain_name" {
  value = var.enable_website_configuration ? aws_s3_bucket_website_configuration.website_configuration[0].website_domain : null
}

output "bucket_website_endpoint" {
  value = var.enable_website_configuration ? aws_s3_bucket_website_configuration.website_configuration[0].website_endpoint : null
}
