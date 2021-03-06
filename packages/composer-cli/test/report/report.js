/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const ReportCmd = require('../../lib/cmds/report/reportCommand.js');
const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-as-promised'));
const fs = require('fs');
const os = require('os');
const nodereport = require('node-report');
const tar = require('tar');



describe('composer report CLI', function() {
    const sandbox = sinon.sandbox.create();
    let consoleLogSpy;
    let mkdtempSyncStub;
    let triggerReportStub;
    let setDirectoryStub;
    let cStub;

    beforeEach(function() {
        consoleLogSpy = sandbox.spy(console, 'log');
        sandbox.stub(process, 'exit');
        mkdtempSyncStub = sandbox.stub(fs,'mkdtempSync').returns('COMPOSER_REPORT_TEMPDIR');
        sandbox.stub(os, 'tmpdir').returns('OS_TEMPDIR');
        triggerReportStub = sandbox.stub(nodereport, 'triggerReport');
        setDirectoryStub = sandbox.stub(nodereport, 'setDirectory');
        cStub = sandbox.stub(tar, 'c').returns(Promise.resolve());
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should successfully run the composer report command with no arguments specified', function() {
        const args = {};
        return ReportCmd.handler(args).then(() => {
            sinon.assert.calledWith(consoleLogSpy, sinon.match('Creating Composer report'));
        });
    });

    it('should create a temporary directory to store files to create the report archive from', function() {
        const args = {};
        return ReportCmd.handler(args).then(() => {
            sinon.assert.calledOnce(mkdtempSyncStub);
            sinon.assert.calledWith(mkdtempSyncStub, 'OS_TEMPDIR/');
        });
    });

    it('should successfully write a node-report report to the temporary directory', function() {
        const args = { };
        return ReportCmd.handler(args).then(() => {
            sinon.assert.calledOnce(setDirectoryStub);
            sinon.assert.calledWith(setDirectoryStub, 'COMPOSER_REPORT_TEMPDIR');
            sinon.assert.calledOnce(triggerReportStub);
        });
    });

    it('should successfully create a zipped tar archive of the COMPOSER_REPORT_TEMPDIR in the current directory and log the output filename in the console', function() {
        const args = { };
        return ReportCmd.handler(args).then(() => {
            sinon.assert.calledOnce(cStub);
            sinon.assert.calledWith(cStub, {
                cwd: 'COMPOSER_REPORT_TEMPDIR/',
                prefix: sinon.match(/^composer-report-\d{8}T\d{6}$/),
                gzip: true,
                file: sinon.match(/^composer-report-\d{8}T\d{6}\.tgz$/)
            }, ['.']);
            sinon.assert.called(consoleLogSpy);
            sinon.assert.calledWith(consoleLogSpy, sinon.match('Triggering node report...'));
            sinon.assert.calledWith(consoleLogSpy, sinon.match('Successfully created Composer report file to'));
            sinon.assert.calledWith(consoleLogSpy, sinon.match(/Output file: .*composer-report-\d{8}T\d{6}\.tgz$/));
        });
    });
});
