pipeline {
    agent any

    environment {
        AWS_DEFAULT_REGION = 'us-east-1'
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Verify Workspace') {
            steps {
                sh '''
                  echo "FILES JENKINS SEES:"
                  ls -la
                '''
            }
        }

        stage('Deploy to S3') {
            steps {
                withAWS(credentials: 'aws-s3-jenkins') {
                    sh '''
                      aws s3 sync . s3://www.moneshabalasambandam.me --delete
                    '''
                }
            }
        }
    }
}
