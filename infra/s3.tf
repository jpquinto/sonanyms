module "s3_bucket" {
  source = "./modules/s3_bucket"
  name   = "sonanyms-bucket"

  context = module.null_label.context

  force_destroy = true

  enable_bucket_versioning      = false
  enable_server_side_encryption = false

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

  enable_website_configuration = false
}


resource "aws_lambda_permission" "allow_s3_to_invoke_ingestor" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = module.word_bank_ingestion_lambda.name
  principal     = "s3.amazonaws.com"
  
  source_arn    = module.s3_bucket.bucket_arn
}

resource "aws_s3_bucket_notification" "word_bank_ingestor_trigger" {
  bucket = module.s3_bucket.bucket_id 

  lambda_function {
    lambda_function_arn = module.word_bank_ingestion_lambda.arn 
    
    events = ["s3:ObjectCreated:*"] 
    filter_prefix = "synonyms/"

    filter_suffix = ".csv" 
  }

  depends_on = [
    aws_lambda_permission.allow_s3_to_invoke_ingestor,
  ]
}

resource "aws_lambda_permission" "allow_s3_to_invoke_chain_ingestor" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = module.chain_word_bank_ingestion_lambda.name
  principal     = "s3.amazonaws.com"
  
  source_arn    = module.s3_bucket.bucket_arn
}

resource "aws_s3_bucket_notification" "chain_word_bank_ingestor_trigger" {
  bucket = module.s3_bucket.bucket_id 

  lambda_function {
    lambda_function_arn = module.chain_word_bank_ingestion_lambda.arn 
    
    events = ["s3:ObjectCreated:*"] 
    filter_prefix = "chain_words/"
    filter_suffix = ".csv" 
  }

  depends_on = [
    aws_lambda_permission.allow_s3_to_invoke_chain_ingestor,
  ]
}