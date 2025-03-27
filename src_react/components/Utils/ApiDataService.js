import { useLocalData } from '../../../src_shared/AppConfig';

const ApiDataService = {
    async fetchData() {
        if (useLocalData) {
            return Promise.all([
                fetch('http://localhost:1235/inputData', {
                    method: "GET"
                }).then(response => response.status !== 204 ? response.json() : undefined),
                fetch('http://localhost:1235/support_tickets', {
                    method: "GET"
                }).then(response => response.status !== 204 ? response.json() : undefined),
                fetch('http://localhost:1235/ideas', {
                    method: "GET"
                }).then(response => response.status !== 204 ? response.json() : undefined),
                fetch('http://localhost:1235/dbConfig', {
                    method: "GET"
                }).then(response => response.status !== 204 ? response.json() : undefined),
                fetch('http://localhost:1235/highlights', {
                    method: "GET"
                }).then(response => response.status !== 204 ? response.json() : undefined),
                fetch('http://localhost:1235/userAccess', {
                    method: "GET"
                }).then(response => response.status !== 204 ? response.json() : undefined),
                fetch('http://localhost:1235/alerts', {
                    method: "GET"
                }).then(response => response.status !== 204 ? response.json() : undefined)
            ])
                .then(([inputData, supportTickets, ideas, dbConfig, highlights, userAccess, alerts]) => 
                    ({ inputData, supportTickets, ideas, dbConfig, highlights, userAccess, alerts }))
        }
        else {
            const prom1 = new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getData('inputData');
            })
            const prom2 = new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getData('support_tickets');
            })
            const prom3 = new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getData('dbConfig');
            })
            const prom4 = new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getData('ideas');
            })
            const prom5 = new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getData('userAccess');
            })
            const prom6 = new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getData('highlights');
            })
            const prom7 = new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getData('alerts');
            })
            return Promise.all([prom1, prom2, prom3, prom4, prom5, prom6, prom7]).then(
                ([prom1, prom2, prom3, prom4, prom5, prom6, prom7]) => 
                ({ "inputData": prom1, "supportTickets": prom2, "dbConfig": prom3, "ideas": prom4, "userAccess": prom5, "highlights": prom6, "alerts": prom7 })
            )
        }
    },
    async getUrlParams() {
        if (useLocalData) {
            return Promise.resolve(new URLSearchParams(window.location.search));
            
        }
        else {
            return new URLSearchParams(window.googleParams);
        }
    },
    async getUserEmail() {
        if (useLocalData) {
            return Promise.resolve('Local@gsa.gov');
        }
        else {
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getActiveUserEmail();
            });
        }
    },
    async submitUpdates(data, type) {
        if (useLocalData) {
            return Promise.all([
                fetch('http://localhost:1235/submitForm', {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: {
                        "Content-Type": "application/json",
                    }
                }).then(response => response.status !== 204 ? response.json() : undefined)
            ])
        }
        else {
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).submitUpdates(data, type);
            });
        }
    },
    async submitFeedback(feedbackData) {
        if (useLocalData) {
        try {
            const response = await fetch('http://localhost:1235/submitFeedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedbackData)
            });
            
            return response.status !== 204 ? response.json() : undefined;
        } catch (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
        } else {
        return new Promise((resolve, reject) => {
            google.script.run
            .withSuccessHandler(resolve)
            .withFailureHandler(reject)
            .submitFeedback(feedbackData);
        });
        }
    },

    async exportData(data, userEmail,tableName) {
        if (useLocalData) {
            return Promise.all([
                fetch('http://localhost:1235/exportData', {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: {
                        "Content-Type": "application/json",
                    }
                }).then(response => response.status !== 204 ? response.json() : undefined)
            ])
        }
        else {
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).exportData(data, userEmail,tableName);
            });
        }
    }
}

export default ApiDataService;