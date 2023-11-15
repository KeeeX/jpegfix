pipeline {
    agent any
    stages {
        stage("Prepare environment") {
            steps {
                withNPM(npmrcConfig: 'npmrc_keeex_read') {
                    sh "npm ci"
                }
            }
        }
        stage("Publish package") {
            steps {
                withNPM(npmrcConfig: 'npmjs_publish') {
                    sh "publish_npmjs.sh"
                }
            }
        }
        stage("Publish API documentation") {
            steps {
                sshagent(credentials: ['ssh_docs']) {
                    sh "publish_apidoc.sh"
                }
            }
        }
    }
}
