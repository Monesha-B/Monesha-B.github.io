pipeline {
    agent any
    environment {
        // AWS region where your S3 bucket exists
        AWS_DEFAULT_REGION = 'us-east-1'
        // Make AWS CLI visible to Jenkins (Homebrew path on macOS)
        PATH = "/opt/homebrew/bin:${env.PATH}"
    }
    stages {
        stage('Checkout Code') {
            steps {
                // Pull code from GitHub repo configured in Jenkins job
                checkout scm
            }
        }
        stage('Verify Workspace') {
            steps {
                sh '''
                  echo "=== FILES JENKINS SEES ==="
                  pwd
                  ls -la
                '''
            }
        }
        stage('Deploy to S3') {
            steps {
                // Use AWS credentials stored in Jenkins
                withAWS(credentials: 'aws-s3-jenkins') {
                    sh '''
                      echo "=== DEPLOYING TO S3 ==="
                      aws --version
                      aws s3 sync . s3://www.moneshabalasambandam.me 
                    '''
                }
            }
        }
        stage('Invalidate CloudFront Cache') {
            steps {
                withAWS(credentials: 'aws-s3-jenkins') {
                    sh '''
                      echo "=== INVALIDATING CLOUDFRONT CACHE ==="
                      aws cloudfront create-invalidation --distribution-id E14P2KUZ9H1YL0 --paths "/*"
                    '''
                }
            }
        }
    }
}
