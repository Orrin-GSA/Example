/**
 * Mock Server for the dev
 */

import fs from 'fs';
import express from 'express';
const app = express();
const PORT = 1235;
import cors from 'cors';
import '../src_shared/RpaTypeDefs.d.ts';
import { CreateMockBugs, CreateMockEnhancements, CreateMockMilestones, CreateMockRankings, CreateMockRpas, CreateMockScripts, getChangeProjects, mock_data, newMilestone, updateBugsAsync, updateEnhancementsAsync, updateMilestonesAsync, updateRankingsAsync, updateRpasAsync, updateScriptsAsync } from './mock_data';
import projectsRouter from './routes/projects';
import enhancementsRouter from './routes/enhancements';
import scriptsRouter from './routes/scripts';
import bugsRouter from './routes/bugs';
import milestonesRouter from './routes/milestones';
import rankingsRouter from './routes/rankings';
import { statusMapping } from '../src_shared/AppConstants.js';
import delay from 'express-delay';

app.use(cors());
app.use(express.json());
// Simulate delay just so we can see can more closely see how the app handles delay (or just see if the UI looks good when something is loading/saving). 
app.use(delay(200, 300));

const logDateFormat = new Intl.DateTimeFormat('en-US', {
    timeZoneName: "short", 
    year: "numeric",
    month: "2-digit",
    day: "2-digit", 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: 'America/New_York'
});

fs.mkdirSync('logs/', { recursive: true });

// Test endpoint 
app.get('/', function (req, res) {
    res.json({ "status": 200, "data": "The mock_data API works. Use /rpa_projects or /rpa_projects/:rpaId to retrieve data." });
});

// Get all 'documents' data 
app.get('/documents', function (req, res) {
    res.json(mock_data.documents);
});

// Get all 'bugs' data 
app.get('/bugs', function (req, res) {
    res.json(mock_data.bugs);
});

// Get all 'system' data 
app.get('/systems', function (req, res) {
    res.json(mock_data.systems);
});

// Get all 'system' data 
app.get('/ideas', function (req, res) {
    res.json(mock_data.ideas);
});

// Get all 'employee_user' data 
app.get('/employee_user', function (req, res) {
    res.json(mock_data.employee_user);
});

// Get all 'npe' data 
app.get('/npe', function (req, res) {
    res.json(mock_data.npe);
});

// Get all 'office' data 
app.get('/office', function (req, res) {
    res.json(mock_data.office);
});

//get all 'poa' data
app.get('/poa_user', function (req, res) {
    res.json(mock_data.poa_user);
});

//get all 'npe' data
app.get('/npe', function (req, res) {
    res.json(mock_data.npe);
});

//get all 'tool' data
app.get('/it_tools', function (req, res) {
    res.json(mock_data.it_tools);
});

//get all 'document' data
app.get('/documents', function (req, res) {
    res.json(mock_data.documents);
});

app.get('/random', async (req, res) => {
    console.log("Creating the randomized mockdata");
    try {

        let projects = CreateMockRpas();
        await updateRpasAsync(projects);
        mock_data.rpa_projects = projects;

        let scripts = CreateMockScripts();
        await updateScriptsAsync(scripts);
        mock_data.scripts = scripts;
        
        let enhancements = CreateMockEnhancements(getChangeProjects(projects, scripts, 2));
        await updateEnhancementsAsync(enhancements);
        mock_data.enhancements = enhancements;
        
        let bugs = CreateMockBugs(getChangeProjects(projects, scripts, 1));
        await updateBugsAsync(bugs);
        mock_data.bugs = bugs;
        
        const statusCheck = (project: ProjectCommon) => project.status === statusMapping.InDevelopment.id || project.status === statusMapping.InProduction.id || project.status === statusMapping.Completed.id;
        let milestones = CreateMockMilestones(projects.filter(statusCheck), enhancements.filter(statusCheck), scripts.filter(statusCheck));
        await updateMilestonesAsync(milestones);
        mock_data.milestones = milestones;
        
        let rankings = CreateMockRankings(projects.concat(enhancements).concat(scripts).concat(bugs));
        await updateRankingsAsync(rankings);
        mock_data.rankings = rankings;

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(400).send(`Error while attempting to post ${err.message}`);
    }
});

app.use('/rpa_projects', projectsRouter);
app.use('/scripts', scriptsRouter);
app.use('/enhancements', enhancementsRouter);
app.use('/bugs', bugsRouter);
app.use('/milestones', milestonesRouter);
app.use('/rankings', rankingsRouter);

app.post('/audit/action', async (req, res) => {
    const { action } = req.body;
    const userName = 'Local Dev';
    const str = `${logDateFormat.format(new Date())} - ${userName}: ${action}\n`;

    // flags: 'a' -> append, '+' -> create if not exists
    const stream = fs.createWriteStream('./logs/audit-logs.txt', {flags:'a+'});
    
    stream.write(str);
    
    stream.end();
    res.status(204).send();
});

app.post('/feedback', async (req, res) => {
    const { feedbackText } = req.body;
    const userName = 'Local Dev';
    const str = `${logDateFormat.format(new Date())} - ${userName}: ${feedbackText}\n`;

    const stream = fs.createWriteStream('./logs/feedback.log', { flags: 'a+' });
    
    stream.write(str);
    
    stream.end();
    res.status(204).send();
});

// Setting the server to listen at port 3000 
app.listen(PORT, function () {
    console.log("Mock rpa data server is running on port " + PORT);
});