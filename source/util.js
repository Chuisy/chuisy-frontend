/**
 * Removes the elements in the specified range from an array
 * @param {Object} from
 * starting removing here
 * @param {Object} to
 * stop removing here
 */
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

/**
 * Inserts the given value at the given index and returns the resulting array. Does NOT alter the original array
 */
Array.prototype.insertAt = function(index, value) {
    return this.slice(0, index).concat([value], this.slice(index));
};