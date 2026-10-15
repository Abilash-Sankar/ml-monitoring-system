pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "ml-monitoring-${BUILD_NUMBER}"
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Unit & Metrics Tests') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            python3 -m venv venv
                            . venv/bin/activate
                            pip install --upgrade pip
                            pip install -r requirements-dev.txt
                            python -m pytest -v --junitxml=test-results.xml
                        '''
                    } else {
                        bat '''
                            python -m venv venv
                            call venv\\Scripts\\activate.bat
                            python -m pip install --upgrade pip
                            python -m pip install -r requirements-dev.txt
                            python -m pytest -v --junitxml=test-results.xml
                        '''
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'test-results.xml'
                }
            }
        }

        stage('Frontend Lint & Build') {
            steps {
                dir('frontend') {
                    script {
                        if (isUnix()) {
                            sh '''
                                npm ci
                                npm run lint
                                npm run build
                            '''
                        } else {
                            bat '''
                                call npm ci
                                call npm run lint
                                call npm run build
                            '''
                        }
                    }
                }
            }
        }

        stage('Docker Compose Validation & Build') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            docker compose config
                            docker compose build
                        '''
                    } else {
                        bat '''
                            docker compose config
                            docker compose build
                        '''
                    }
                }
            }
        }

        stage('Monitoring Stack Smoke Test') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            # Start container stack in detached mode
                            docker compose up -d

                            # Wait for services to report healthy
                            sleep 15

                            # Verify backend API and Prometheus metrics
                            curl -fsS http://localhost:8000/health || exit 1
                            curl -fsS http://localhost:8000/metrics | grep -E "(http_requests_total|prediction_requests_total)" || exit 1

                            # Verify Prometheus server
                            curl -fsS http://localhost:9090/-/healthy || exit 1

                            # Verify Grafana server
                            curl -fsS http://localhost:3001/api/health || exit 1
                        '''
                    } else {
                        bat '''
                            docker compose up -d
                            powershell -Command "Start-Sleep -Seconds 15"
                            powershell -Command "Invoke-WebRequest -Uri 'http://localhost:8000/health' -UseBasicParsing"
                            powershell -Command "Invoke-WebRequest -Uri 'http://localhost:8000/metrics' -UseBasicParsing"
                            powershell -Command "Invoke-WebRequest -Uri 'http://localhost:9090/-/healthy' -UseBasicParsing"
                            powershell -Command "Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing"
                        '''
                    }
                }
            }
            post {
                always {
                    script {
                        if (isUnix()) {
                            sh 'docker compose down -v'
                        } else {
                            bat 'docker compose down -v'
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Jenkins Pipeline: ML Monitoring system built, tested, and verified successfully."
        }
        failure {
            echo "Jenkins Pipeline: Build failed. Check stage logs for details."
        }
        always {
            cleanWs deleteDirs: true, notFailBuild: true
        }
    }
}
