const { Type } = require('@mikro-orm/core');
const utils = require('../utils');

class VectorType extends Type {
  convertToDatabaseValue(value, platform) {
    if (value === null) {
      return null;
    }
    return utils.toSql(value);
  }

  convertToJSValue(value, platform) {
    if (value === null) {
      return null;
    }
    return utils.fromSql(value);
  }

  getColumnType(prop, platform) {
    return utils.vectorType(prop.dimensions);
  }
}

module.exports = {VectorType};
