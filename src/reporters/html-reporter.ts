/* eslint-disable prettier/prettier */
import fs from 'fs';
import { PipelineItem } from '../types';

export default async function report(items: PipelineItem[]): Promise<void> {
  const fileName = 'vf-core-service-discovery-report.html';

  await fs.promises.writeFile(fileName, render(items), 'utf-8');

  console.log(`\nReport saved in ${fileName}\n`);
}

function render(items: PipelineItem[]): string {
  return `
  <!doctype html>
  <html>
  <head>
    <title>vf-core-service-discovery report</title>

    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
    <style>
      * {
        padding: 0;
        margin: 0;
        --tw-ring-inset: var(--tw-empty,/*!*/ /*!*/);
        --tw-ring-offset-width: 0px;
        --tw-ring-offset-color: #fff;
        --tw-ring-color: rgba(59,130,246,0.5);
        --tw-ring-offset-shadow: 0 0 transparent;
        --tw-ring-shadow: 0 0 transparent;
        --tw-shadow: 0 1px 3px 0 rgba(0,0,0,0.1),0 1px 2px 0 rgba(0,0,0,0.06);
      }

      body {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 16px;
        background: #F5F5F4;
        color: #374151;
      }

      a {
        text-decoration: none;
        color: #0284C7;
      }

      a:hover {
        color: #075985;
      }

      .container {
        max-width: 540px;
        margin: 3rem auto;
      }

      .bg-red {
        background-color: #B91C1C;
        color: #fff;
        padding: 0.1rem 0.25rem;
        border-radius: 0.2rem;
      }

      .bg-green {
        background-color: #15803D;
        color: #fff;
        padding: 0.1rem 0.25rem;
        border-radius: 0.2rem;
      }

      .items {
        padding-top: 2rem;
      }

      .item {
        margin-bottom: 1.5rem;
        box-shadow: var(--tw-ring-offset-shadow,0 0 transparent),var(--tw-ring-shadow,0 0 transparent),var(--tw-shadow);
        background: #fff;
      }

      .item__header {
        padding: 0.5rem 0.8rem;
        font-size: 0.85rem;
        border-bottom: 1px solid #dbdbdb;
        display: flex;
        align-items: center;
      }

      .item__content {
        padding: 1rem 0.8rem;
      }

      .item__content-row {
        margin-bottom: 0.6rem;
      }

      .item__content-row--flex {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }

      .item__content-row-title {
        font-weight: 500;
      }

      .toc {
        padding-top: 2rem;
      }

      .toc ul {
        padding-top: 0.65rem;
        list-style: none;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <h1>vf-core-service-discovery report</h1>

      <details class="toc">
        <summary>Table of contents</summary>
        <ul>
          ${items.map(item => `
          <li>
            <a href="#${item.discoveryItem.nameWithoutPrefix}">${item.discoveryItem.nameWithoutPrefix}</a>
            ${item.discoveryItem.version !== item.discoveryItem.packageJson?.version ? `
            <span class="bg-red" style="font-size: 0.7rem">outdated</span>
            ` : ''}
          </li>
          `).join('')}
        </ul>
      </details>

      <div class="items">
      ${items.map(item => `
        <div class="item">
          <div class="item__header">
            ${item.discoveryItem.version !== item.discoveryItem.packageJson?.version ? `
            <svg style="width: 1rem; height: 1rem; margin-right: 0.6rem; color: #D97706;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>` : ''}
            <h2 id="${item.discoveryItem.nameWithoutPrefix}">
              <a href="https://www.npmjs.com/package/${item.discoveryItem.name}" target="_blank">
                ${item.discoveryItem.nameWithoutPrefix}
              </a>
            </h2>
          </div>
          <div class="item__content">
            <div class="item__content-row item__content-row--flex">
              <span class="item__content-row-title">Used version</span>
              <span class="
              ${item.discoveryItem.version !== item.discoveryItem.packageJson?.version ? 'bg-red' : ''}
              ">${item.discoveryItem.version}</span>
            </div>
            <div class="item__content-row item__content-row--flex">
              <span class="item__content-row-title">Latest version</span>
              <span class="
              ${item.discoveryItem.version !== item.discoveryItem.packageJson?.version ? 'bg-green' : ''}
              ">${item.discoveryItem.packageJson?.version}</span>
            </div>
            <div class="item__content-row item__content-row--flex">
              <span class="item__content-row-title">Status</span>
              <span>${item.discoveryItem.config?.status}</span>
            </div>
            ${!item.discoveryItem.changelog?.length ? '' : `
            <div class="item__content-row">
              <p class="item__content-row-title" style="padding-bottom: 0.3rem">Changelog</p>
              ${item.discoveryItem.changelog.map(changelogItem => `
              <div>
                <p style="margin-bottom: 0.35rem">${changelogItem.version}</p>
                <ul style="padding-left: 1.5rem">
                ${changelogItem.changes.map(change => `
                  <li>${change}</li>
                `).join('')}
                </ul>
              </div>
              `).join('')}
            </div>
            `}
            <div class="item__content-row">
              <p class="item__content-row-title">Dependents</p>
              ${item.discoveryItem.dependents?.length === 0
                ? '<p>None</p>'
                : `
                <ul style="list-style: none; padding-top: 0.4rem;">
                  ${item.discoveryItem.dependents?.map(dependent => `
                  <li>${dependent}</li>
                  `).join('')}
                </ul>
                `
              }
            </div>
          </div>
          <div class="item__footer"></div>
        </div>
      `).join('')}
      </div>
    </div>
  </body>
  </html>
  `;
}
