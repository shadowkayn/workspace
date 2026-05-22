export function success(res, data = {}, message = "success") {
  res.json({
    code: 200,
    message,
    data,
  });
}
