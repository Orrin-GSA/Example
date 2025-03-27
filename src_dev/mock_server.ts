/**
 * Mock Server for the dev
 */
import fs from 'fs';
import express from 'express';
const app = express();
const PORT = 1235;
import cors from 'cors';
import bodyParser from 'body-parser';
app.use(cors());

const jsonParser = bodyParser.json();

const getOrCreateFile = (file: string, defaultValue: () => any) => {
    let data = '';
    if(!fs.existsSync(file)) {
        data = JSON.stringify(defaultValue());

        const path = file.split('/');
        if(path.length > 1) {
            const folderPath = "./" + path.slice(0, -1).join('/');
            fs.mkdirSync(folderPath, { recursive: true });
        }

        fs.writeFileSync(file, data, { encoding: 'utf8', flag: 'w' });
    }
    else {
        data = fs.readFileSync(file, 'utf8');
    }

    return data;
}

// Test endpoint 
app.get('/', function (req, res) {
    res.json({ "status": 200, "data": "The mock_data API works. Use /rpa_projects or /rpa_projects/:rpaId to retrieve data." });
});

app.get('/inputData/', async function (req, res, next) {
    const data = getOrCreateFile('input/inputData.json', () => []);
    if (data.toString() === "") {
        return res.status(400).send('[]');
    }
    // console.log(JSON.parse(data))
    return res.json(JSON.parse(data));
})

app.get('/logs/', async function (req, res, next) {
    const data = getOrCreateFile('data/logs.txt', () => [])
    if (data.toString() === "") {
        return res.status(400).send('[]');
    }
    // console.log(JSON.parse(data))
    return res.json(JSON.parse(data));
})


app.get('/dbConfig/', async function (req, res, next) {
    const data = getOrCreateFile('settings/dbConfig.json', () => [])
    if (data.toString() === "") {
        return res.status(400).send('[]');
    }
    // console.log(JSON.parse(data))
    return res.status(200).send(data);
})

app.get('/support_tickets/', async function (req, res, next) {
    const data = getOrCreateFile('input/support_tickets.json', () => [])
    if (data.toString() === "") {
        return res.status(400).send('[]');
    }
    // console.log(JSON.parse(data))
    return res.status(200).send(data)
})
app.get('/alerts/', async function (req, res, next) {
    const data = getOrCreateFile('input/alerts.json', () => [])
    if (data.toString() === "") {
        return res.status(400).send('[]');
    }
    // console.log(JSON.parse(data))
    return res.status(200).send(data)
})
app.get('/ideas/', async function (req, res, next) {
    const data = getOrCreateFile('input/ideas.json', () => [])
    if (data.toString() === "") {
        return res.status(400).send('[]');
    }
    // console.log(JSON.parse(data))
    return res.status(200).send(data)
})

app.get('/highlights/', async function (req, res, next) {
    const data = getOrCreateFile('input/highlights.json', () => [])
    if (data.toString() === "") {
        return res.status(400).send('[]');
    }
    // console.log(JSON.parse(data))
    return res.status(200).send(data)
})

app.get('/userAccess/', async function (req, res, next) {
    return res.status(200).send({"Employee Email":"chantelle.lim@gsa.gov","Supervisor Email":"","Region":"","isAdmin":true})
})

app.post('/submitForm', jsonParser, async function (req, res, next) {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).send([]);
        }
        console.log(data)
        // Place updated data into the file (database)
        fs.appendFile('data/output.txt', JSON.stringify(data), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error adding data');
            }
            res.status(200).send(data);
        });
    }
    catch (e) {
        console.log(`Error while attempting to post ${e.message}`);
        res.send(`Error while attempting to post ${e.message}`);
    }
})

app.post('/exportData', jsonParser, async function (req, res, next) {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).send([]);
        }
        console.log(data)
        // Place updated data into the file (database)
        fs.appendFile('data/dataExport.txt', JSON.stringify(data), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error adding data');
            }
            res.status(200).send({"msg":{"id":"1n4aZmBkwUd1UcWeXnF7JenmBCxeg7ES4Kcv72RVrShA"}});
        });
    }
    catch (e) {
        console.log(`Error while attempting to post ${e.message}`);
        res.send(`Error while attempting to post ${e.message}`);
    }
})
app.post('/submitFeedback', jsonParser, async function (req, res, next) {
    try {
        const feedbackData = req.body;
        if (!feedbackData) {
            return res.status(400).json({ 
                success: false, 
                message: 'No feedback data provided' 
            });
        }
        if (!feedbackData.type || !feedbackData.comment) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required feedback fields' 
            });
        }
    
        if (!feedbackData.date) {
            feedbackData.date = new Date().toISOString();
        }
        
        console.log('Received feedback:', feedbackData);
        const feedbackFilePath = 'data/feedback.json';
        let existingFeedback = [];
        
        try {
            const data = getOrCreateFile(feedbackFilePath, () => []);
            existingFeedback = JSON.parse(data);
        } catch (error) {
            console.error('Error reading feedback file:', error);
        }
    
        existingFeedback.push({
            id: Date.now(),
            ...feedbackData
        });
        
        fs.writeFileSync(feedbackFilePath, JSON.stringify(existingFeedback, null, 2), { 
            encoding: 'utf8', 
            flag: 'w' 
        });
        
        res.status(200).json({ 
            success: true, 
            message: 'Feedback received successfully' 
        });
    } catch (e) {
        console.log(`Error while submitting feedback: ${e.message}`);
        res.status(500).json({ 
            success: false, 
            message: `Error while submitting feedback: ${e.message}` 
        });
    }
})
// Setting the server to listen at port 3000 
app.listen(PORT, () => {
    console.log("Mock rpa data server is running on port " + PORT);
}); 