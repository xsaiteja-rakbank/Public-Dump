import SwaggerParser from '@apidevtools/swagger-parser';
import yaml from 'js-yaml';

export async function validateOpenApi(content, isYaml = true) {
  let parsedDoc;
  try {
    if (typeof content === 'string') {
      parsedDoc = isYaml ? yaml.load(content) : JSON.parse(content);
    } else {
      parsedDoc = content;
    }
  } catch (err) {
    return {
      valid: false,
      errors: [
        {
          type: 'SYNTAX_ERROR',
          message: `Failed to parse ${isYaml ? 'YAML' : 'JSON'}: ${err.message}`,
          location: err.mark ? `Line ${err.mark.line + 1}, Column ${err.mark.column + 1}` : 'Document root'
        }
      ]
    };
  }

  if (!parsedDoc || typeof parsedDoc !== 'object') {
    return {
      valid: false,
      errors: [{ type: 'STRUCTURE_ERROR', message: 'Document is empty or not a valid object.' }]
    };
  }

  // Structural check: check OpenAPI or Swagger version
  const openapiVersion = parsedDoc.openapi || parsedDoc.swagger;
  if (!openapiVersion) {
    return {
      valid: false,
      errors: [{ type: 'VERSION_ERROR', message: 'Missing "openapi" or "swagger" version declaration.' }]
    };
  }

  // Deep validation with SwaggerParser (dereference & validate against OpenAPI schema)
  try {
    // Clone document so parser does not mutate input object unexpectedly
    const docClone = JSON.parse(JSON.stringify(parsedDoc));
    await SwaggerParser.validate(docClone);

    // Extract summary statistics
    const stats = extractApiStats(parsedDoc);

    return {
      valid: true,
      document: parsedDoc,
      stats,
      errors: []
    };
  } catch (err) {
    return {
      valid: false,
      document: parsedDoc,
      errors: [
        {
          type: 'SCHEMA_VALIDATION_ERROR',
          message: err.message,
          details: err.details || null
        }
      ]
    };
  }
}

export function extractApiStats(doc) {
  const openapiVersion = doc.openapi || doc.swagger || 'Unknown';
  const title = doc.info?.title || 'Untitled API';
  const version = doc.info?.version || 'v1';
  const description = doc.info?.description || '';
  const servers = doc.servers || (doc.host ? [{ url: `${doc.schemes ? doc.schemes[0] : 'https'}://${doc.host}${doc.basePath || ''}`, description: 'Default Host' }] : []);

  let pathsCount = 0;
  let operationsCount = 0;
  const operations = [];

  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];

  if (doc.paths && typeof doc.paths === 'object') {
    pathsCount = Object.keys(doc.paths).length;
    for (const [pathKey, pathObj] of Object.entries(doc.paths)) {
      if (!pathObj || typeof pathObj !== 'object') continue;
      for (const method of methods) {
        if (pathObj[method]) {
          operationsCount++;
          operations.push({
            path: pathKey,
            method: method.toUpperCase(),
            operationId: pathObj[method].operationId || null,
            summary: pathObj[method].summary || null,
            description: pathObj[method].description || null,
            tags: pathObj[method].tags || []
          });
        }
      }
    }
  }

  return {
    title,
    version,
    openapiVersion,
    description,
    servers,
    pathsCount,
    operationsCount,
    operations
  };
}
