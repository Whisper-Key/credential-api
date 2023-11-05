import { CredentialMetadata } from "../models/CredentialMetadata.js";
import CredentialGenerator from "../services/CredentialGenerator.js";
import path from "path";
import fs from 'fs';
import { ContractDeployer } from '../services/ContractDeployer.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { CredentialRepository } from "../services/CredentialRepository.js";
import pkg from 'webpack';
const { webpack } = pkg;

export class CredentialsPipeline {

  
  public async run(creds: CredentialMetadata) {
    const file = this.generateCredentialFile(creds);
    this.bundleCredential(file, creds);
    await this.storeCredential(creds);
    this.DeployToNetwork(creds);
  }

  async DeployToNetwork(creds: CredentialMetadata) {
    console.log("Deploying to network");
    const deployer = new ContractDeployer();
    const result = await deployer.deployCredential(creds.name);

    creds.contractPrivateKey = result.privateKey;
    creds.contractPublicKey = result.publicKey;
    creds.transactionUrl = result.transactionUrl;
    await (new CredentialRepository().AddCredential(creds));
    console.log("Deployed to network");
}

  async storeCredential(creds: CredentialMetadata) {
    console.log("Storing credential");
    await (new CredentialRepository().AddCredential(creds));
    console.log("Stored credential");
  }

  bundleCredential(file: string, creds: CredentialMetadata) {
    console.log("Bundling credential");
    const config = {
      entry: file,
      output: {
        filename: `${creds.name}Contract.js`,    // The name of the output bundle file.
        path: path.resolve('public', 'credentials', 'bundled'),  // The directory to output the bundle.
        libraryTarget: 'module', // Use 'module' to target ECMAScript modules (ESM).
      },
      experiments: {
        outputModule: true, // Enable the output module feature for ESM.
      },
    };
    const compiler = webpack(config);

    compiler.run((err, stats) => {
      if (err) {
        console.error(err);
      }
      console.log(stats.toString());
    });
  }

  generateCredentialFile(creds: CredentialMetadata) {
    console.log("Generating credential file");
    const templatePath = path.resolve(`public/CredentialTemplate.mustache`);
    const templateContent = fs.readFileSync(templatePath, 'utf-8');

    const template = "";
    const generator = new CredentialGenerator();
    const file =  generator.generateAndSave(creds, templateContent);
    console.log("Generated credential file");
    return file;
  }
}
