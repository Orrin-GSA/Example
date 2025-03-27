/**
 * Holds API endpoints and const objects (for testing if the API isn't functional) 
 * updated 2/07/2024
 */
const Endpoints = {
    local_endpoint: "http://localhost:1235/",
    prod_endpoint: "https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec",
    prod_post: "https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec",

    prod_rpa_projects: "https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec?type=specific&table=rpa_projects",
    prod_employee_user: "https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec?type=specific&table=employee_user",
    prod_office: "https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec?type=specific&table=office",
    milestone:"https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec?type=specific&table=rpa_milestones",
    prod_poa_users:"https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec?type=specific&table=poa_team",
    prod_enhancements:"https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec?type=specific&table=enhancements",
    prod_systems: "https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec?type=specific&table=systems",
    prod_ideas: "https://script.google.com/a/macros/gsa.gov/s/AKfycby7Thv97LUgWxjkdX6g7ACM1OCSSDhwakp5BBgnIMo1JhhCzcXJFNMNbBim6PNGaWxvVg/exec?type=specific&table=submission_idea"
}

export default Endpoints;