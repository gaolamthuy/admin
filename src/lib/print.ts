/**
 * Shared print utilities
 * Gửi form POST để mở endpoint in của Windmill ở tab mới
 *
 * @module lib/print
 */

export const submitPostForm = (
  url: string,
  params: Record<string, string>,
  target = '_blank'
) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  form.target = target;
  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};
