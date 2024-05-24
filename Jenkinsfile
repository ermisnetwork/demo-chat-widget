pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sh '''
                    docker-compose up --build -d
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                sh '''
                docker builder prune --force
                '''
            }
            cleanWs()
        }
    }
}
