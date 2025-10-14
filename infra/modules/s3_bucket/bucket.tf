###########
# General
###########

module "label_bucket" {
  source = "cloudposse/label/null"

  name = var.name

  label_order = ["namespace", "environment", "name"]

  context = var.context
}

resource "aws_s3_bucket" "s3" {
  bucket = module.label_bucket.id

  force_destroy = var.force_destroy

  tags = module.label_bucket.tags
}

###########
# Bucket policy
###########

resource "aws_s3_bucket_policy" "bucket_policy" {
  count = var.bucket_policy != "" ? 1 : 0

  bucket = aws_s3_bucket.s3.id
  policy = replace(replace(var.bucket_policy, "{SELF_NAME}", aws_s3_bucket.s3.id), "{SELF_ARN}", aws_s3_bucket.s3.arn)
}

###########
# Bucket versioning
###########

resource "aws_s3_bucket_versioning" "bucket_versioning" {
  count = var.enable_bucket_versioning ? 1 : 0

  bucket = aws_s3_bucket.s3.bucket

  versioning_configuration {
    status = "Enabled"
  }
}

###########
# Server Side Encryption
###########

resource "aws_s3_bucket_server_side_encryption_configuration" "server_side_encryption" {
  count = var.enable_server_side_encryption ? 1 : 0

  bucket = aws_s3_bucket.s3.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.sse_algorithm
      kms_master_key_id = var.kms_key_id
    }
    bucket_key_enabled = var.encryption_bucket_key_enabled
  }
}

###########
# Public Access Block
###########

resource "aws_s3_bucket_public_access_block" "public_access_block" {
  bucket = aws_s3_bucket.s3.id

  block_public_acls       = var.block_public_acls
  block_public_policy     = var.block_public_policy
  ignore_public_acls      = var.ignore_public_acls
  restrict_public_buckets = var.restrict_public_buckets
}

###########
# Website Configuration
###########

resource "aws_s3_bucket_website_configuration" "website_configuration" {
  count = var.enable_website_configuration ? 1 : 0

  bucket = aws_s3_bucket.s3.bucket

  index_document {
    suffix = var.website_index_document
  }

  error_document {
    key = var.website_error_document
  }

  dynamic "routing_rule" {
    for_each = var.routing_rule

    content {
      condition {
        key_prefix_equals = lookup(routing_rule.value.condition, "key_prefix_equals", null)
      }

      redirect {
        host_name               = lookup(routing_rule.value.redirect, "host_name", null)
        http_redirect_code      = lookup(routing_rule.value.redirect, "http_redirect_code", null)
        protocol                = lookup(routing_rule.value.redirect, "protocol", null)
        replace_key_prefix_with = lookup(routing_rule.value.redirect, "replace_key_prefix_with", null)
        replace_key_with        = lookup(routing_rule.value.redirect, "replace_key_with", null)
      }
    }
  }
}
